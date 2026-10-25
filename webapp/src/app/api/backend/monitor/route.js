import {NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '../../../../components/logger.js';

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10; // Max 10 requests per 15 minutes per IP

const getRateLimitKey = (request) => {
    // Get client IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    return ip;
};

const checkRateLimit = (key) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, []);
    }

    const requests = rateLimitMap.get(key);

    // Remove old requests outside the window
    const validRequests = requests.filter(time => time > windowStart);

    if (validRequests.length >= MAX_REQUESTS) {
        return false; // Rate limit exceeded
    }

    // Add current request
    validRequests.push(now);
    rateLimitMap.set(key, validRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup
        cleanupRateLimit();
    }

    return true;
};

const cleanupRateLimit = () => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    for (const [key, requests] of rateLimitMap.entries()) {
        const validRequests = requests.filter(time => time > windowStart);
        if (validRequests.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, validRequests);
        }
    }
};

export async function GET(request) {
    try {
        // Rate limiting check
        const rateLimitKey = getRateLimitKey(request);
        if (!checkRateLimit(rateLimitKey)) {
            logger.warn(`Rate limit exceeded for IP: ${rateLimitKey}`);
            return NextResponse.json({
                error: 'Too many requests. Please try again later.'
            }, {
                status: 429,
                headers: {
                    'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString()
                }
            });
        }

        // API Key validation
        const expectedApiKey = process.env.MONITOR_API_KEY;
        if (!expectedApiKey) {
            return NextResponse.json({error: 'Monitor API not configured'}, {status: 500});
        }

        // Get API key from headers only
        const authHeader = request.headers.get('authorization');
        const apiKeyHeader = request.headers.get('x-api-key');

        let providedApiKey = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            providedApiKey = authHeader.substring(7);
        } else if (apiKeyHeader) {
            providedApiKey = apiKeyHeader;
        }

        if (!providedApiKey || providedApiKey !== expectedApiKey) {
            return NextResponse.json({error: 'Unauthorized - Invalid API key'}, {status: 401});
        }

        const {searchParams} = new URL(request.url);
        const action = searchParams.get('action');
        const filename = searchParams.get('file');

        // Sanitize filename to prevent path traversal
        const sanitizeFilename = (name) => {
            if (!name) return null;

            // Remove any path separators and parent directory references
            const sanitized = name.replace(/[\/\\]/g, '').replace(/\.\./g, '');

            // Only allow alphanumeric, dots, dashes, underscores
            const cleanName = sanitized.replace(/[^a-zA-Z0-9\.\-_]/g, '');

            // Must end with .log and not be empty
            if (!cleanName.endsWith('.log') || cleanName.length <= 4) {
                return null;
            }

            return cleanName;
        };

        // Get log directory from environment or default
        const logDirectory = process.env.LOG_DIRECTORY || 'logs';
        const logPath = path.resolve(logDirectory);

        // Ensure log directory exists
        if (!fs.existsSync(logPath)) {
            return NextResponse.json({error: 'Internal Check Error'}, {status: 500});
        }

        switch (action) {
            case 'list':
                // List all log files
                const files = fs.readdirSync(logPath)
                    .filter(file => file.endsWith('.log'))
                    .map(file => {
                        const filePath = path.join(logPath, file);
                        const stats = fs.statSync(filePath);
                        return {
                            name: file,
                            size: stats.size,
                            modified: stats.mtime.toISOString(),
                            created: stats.birthtime.toISOString()
                        };
                    })
                    .sort((a, b) => new Date(b.modified) - new Date(a.modified));

                return NextResponse.json({files});

            case 'download':
                // Download specific log file
                const sanitizedDownloadFilename = sanitizeFilename(filename);
                if (!sanitizedDownloadFilename) {
                    return NextResponse.json({error: 'Invalid filename'}, {status: 400});
                }

                const downloadPath = path.join(logPath, sanitizedDownloadFilename);
                if (!fs.existsSync(downloadPath)) {
                    return NextResponse.json({error: 'File not found'}, {status: 404});
                }

                const fileContent = fs.readFileSync(downloadPath);

                return new NextResponse(fileContent, {
                    headers: {
                        'Content-Type': 'text/plain',
                        'Content-Disposition': `attachment; filename="${sanitizedDownloadFilename}"`,
                        'Content-Length': fileContent.length.toString()
                    }
                });

            case 'content':
                // Get file content
                const sanitizedContentFilename = sanitizeFilename(filename);
                if (!sanitizedContentFilename) {
                    return NextResponse.json({error: 'Invalid filename'}, {status: 400});
                }

                const contentPath = path.join(logPath, sanitizedContentFilename);
                if (!fs.existsSync(contentPath)) {
                    return NextResponse.json({error: 'File not found'}, {status: 404});
                }

                const content = fs.readFileSync(contentPath, 'utf8');
                const lines = content.split('\n');

                return NextResponse.json({
                    content,
                    lines: lines.length,
                    size: content.length,
                    lastModified: fs.statSync(contentPath).mtime.toISOString()
                });

            default:
                return NextResponse.json({error: 'Invalid action'}, {status: 400});
        }

    } catch (error) {
        logger.error('Monitor API error:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}
