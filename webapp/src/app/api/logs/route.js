import {NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';

// Rate limiting map to prevent spam
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Log level-based rate limits (requests per minute per IP)
const RATE_LIMITS_BY_LEVEL = {
    debug: 1000,  // Highest limit - debug is most verbose
    info: 1000,   // Medium-high - regular app flow
    warn: 20,   // Medium - warnings should be less frequent
    error: 20    // Lowest - errors should be rare
};

// File size limit (50MB in bytes)
const MAX_LOG_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitMap.entries()) {
        if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

function getRateLimitKey(request) {
    // Use IP and User-Agent for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    return `${ip}:${userAgent.substring(0, 50)}`;
}

function isRateLimited(key, logLevel = 'info') {
    const now = Date.now();
    const maxRequests = RATE_LIMITS_BY_LEVEL[logLevel] || RATE_LIMITS_BY_LEVEL.info;

    // Create level-specific key to track different limits per log level
    const levelKey = `${key}:${logLevel}`;
    const entry = rateLimitMap.get(levelKey);

    if (!entry) {
        rateLimitMap.set(levelKey, {count: 1, firstRequest: now, level: logLevel});
        return false;
    }

    if (now - entry.firstRequest > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(levelKey, {count: 1, firstRequest: now, level: logLevel});
        return false;
    }

    if (entry.count >= maxRequests) {
        return true;
    }

    entry.count++;
    return false;
}

function sanitizeLogData(data) {
    if (!data || typeof data !== 'object') return null;

    // Only allow specific fields and sanitize them
    const sanitized = {};

    if (data.level && typeof data.level === 'string') {
        sanitized.level = data.level.replace(/[^\w]/g, '').substring(0, 10);
    }

    if (data.message && typeof data.message === 'string') {
        // Remove potentially dangerous characters and limit length
        sanitized.message = data.message
            .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
            .replace(/[<>\"'&]/g, '') // Remove HTML/XSS characters
            .substring(0, 1000);
    }

    if (data.data && typeof data.data === 'string') {
        sanitized.data = data.data
            .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
            .replace(/[<>\"'&]/g, '')
            .substring(0, 100000);
    }

    if (data.timestamp && typeof data.timestamp === 'string') {
        // Validate ISO timestamp format
        const timestamp = new Date(data.timestamp);
        if (!isNaN(timestamp.getTime())) {
            sanitized.timestamp = timestamp.toISOString();
        }
    }

    if (data.url && typeof data.url === 'string') {
        sanitized.url = data.url
            .replace(/[^\w\/\-\.\?=&]/g, '')
            .substring(0, 200);
    }

    return sanitized;
}

export async function POST(request) {
    try {
        // Parse and validate request first
        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {error: 'Invalid JSON'},
                {status: 400}
            );
        }

        // Sanitize log data
        const sanitizedData = sanitizeLogData(body);
        if (!sanitizedData || !sanitizedData.level || !sanitizedData.message) {
            return NextResponse.json(
                {error: 'Invalid log data'},
                {status: 400}
            );
        }

        // Validate log level
        const validLevels = ['debug', 'info', 'warn', 'error'];
        if (!validLevels.includes(sanitizedData.level)) {
            return NextResponse.json(
                {error: 'Invalid log level'},
                {status: 400}
            );
        }

        // Rate limiting based on log level
        const rateLimitKey = getRateLimitKey(request);
        if (isRateLimited(rateLimitKey, sanitizedData.level)) {
            return NextResponse.json(
                {error: `Rate limit exceeded for ${sanitizedData.level} level logs`},
                {status: 429}
            );
        }

        // Get log directory
        const logDirectory = process.env.LOG_DIRECTORY || 'logs';
        const logPath = path.resolve(logDirectory);

        // Ensure log directory exists
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath, {recursive: true});
        }

        // Create client log file name (separate from server logs)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const clientLogFile = `client-${year}-${month}-${day}.log`;

        // Format log entry (similar to server logger format)
        const timestamp = sanitizedData.timestamp || now.toISOString();
        const formattedTimestamp = timestamp.replace('T', ' ').substring(0, 19);

        let logEntry = `[${formattedTimestamp}] ${sanitizedData.level.toUpperCase()}: [CLIENT] ${sanitizedData.message}`;

        if (sanitizedData.data) {
            logEntry += `\n${sanitizedData.data}`;
        }

        if (sanitizedData.url) {
            logEntry += ` (${sanitizedData.url})`;
        }

        logEntry += '\n';

        // Write to file
        const logFilePath = path.join(logPath, clientLogFile);

        // Check file size limit before writing
        if (fs.existsSync(logFilePath)) {
            const stats = fs.statSync(logFilePath);
            if (stats.size >= MAX_LOG_FILE_SIZE) {
                return NextResponse.json(
                    {error: 'Log file size limit exceeded (50MB). Logs are being rejected.'},
                    {status: 507} // Insufficient Storage
                );
            }
        }

        fs.appendFileSync(logFilePath, logEntry);

        return NextResponse.json({success: true});

    } catch (error) {
        console.error('Client log API error:', error);
        return NextResponse.json(
            {error: 'Internal server error'},
            {status: 500}
        );
    }
}