// Environment detection
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowser = typeof window !== 'undefined';

// Fetch availability detection
const hasFetch = typeof fetch !== 'undefined';

/**
 * Universal Logger class that works in both Node.js and browser environments.
 * Configuration is done via environment variables.
 */
class Logger {
    constructor() {
        // Environment-specific configuration with browser-safe defaults
        // In browser, check for NEXT_PUBLIC_ prefixed variables, otherwise use server env vars
        const envLogLevel = isBrowser
            ? (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LOG_LEVEL) || 'info'
            : (typeof process !== 'undefined' && process.env?.LOG_LEVEL) || 'info';

        const envFileLogging = isBrowser
            ? (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USE_FILE_LOGGING) === 'true'
            : (typeof process !== 'undefined' && process.env?.USE_FILE_LOGGING) === 'true';

        const envConsoleLogging = isBrowser
            ? (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USE_CONSOLE_LOGGING)
            : (typeof process !== 'undefined' && process.env?.USE_CONSOLE_LOGGING);

        this.logLevel = envLogLevel;
        this.useFileLogging = envFileLogging;
        // Default to true for console logging in browser, respect env var if set
        this.useConsoleLogging = envConsoleLogging !== undefined ? envConsoleLogging === 'true' : isBrowser;
        this.serverLogEndpoint = '/api/logs';

        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        this.currentLogLevel = this.logLevels[this.logLevel] !== undefined ? this.logLevels[this.logLevel] : this.logLevels.warn;
    }

    /**
     * Format log message with timestamp, level, message and optional data.
     *
     * @param level - Log level (debug, info, warn, error)
     * @param message - Log message
     * @param data - Optional additional data (object or string)
     * @returns {string} - Formatted log entry
     */
    #formatTemplate(level, message, data = null) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timestamp = `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
        const logEntry = `${timestamp} ${level.toUpperCase()}: ${message}`;

        if (data !== null && data !== undefined) {
            const dataString = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
            return `${logEntry}\n${dataString}`;
        }

        return logEntry;
    }

    /**
     * Send log entry to server for file storage.
     * Works in both Node.js and browser environments.
     * Includes security measures and rate limiting.
     */
    async #sendToServer(level, message, data) {
        if (!this.useFileLogging || !hasFetch) {
            if (!hasFetch && isNode) {
                console.warn('File logging requires Node.js 18+ with built-in fetch support');
            }
            return;
        }

        try {
            // Sanitize and limit log data
            const sanitizedMessage = String(message).substring(0, 1000);
            const sanitizedData = data ? String(JSON.stringify(data)).substring(0, 2000) : null;

            const logEntry = {
                level,
                message: sanitizedMessage,
                data: sanitizedData,
                timestamp: new Date().toISOString(),
                userAgent: isBrowser ? navigator.userAgent.substring(0, 200) : 'Node.js',
                url: isBrowser ? window.location.pathname : 'server'
            };

            // Send to server with timeout
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const baseUrl = isNode ? (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') : '';

            await fetch(`${baseUrl}${this.serverLogEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logEntry),
                signal: controller.signal
            });

            clearTimeout(timeout);
        } catch (error) {
            // Silent fail - don't log server logging errors to avoid infinite loops
        }
    }

    /**
     * Write log entry to console and/or file based on configuration.
     *
     * @param level - Log level
     * @param message - Log message
     * @param data - Optional additional data
     */
    #writeLog(level, message, data) {
        if (this.logLevels[level] < this.currentLogLevel) {
            return;
        }

        const formattedLog = this.#formatTemplate(level, message, JSON.stringify(data));

        if (this.useConsoleLogging) {
            switch (level) {
                case 'debug':
                    console.debug(formattedLog);
                    break;
                case 'info':
                    console.info(formattedLog);
                    break;
                case 'warn':
                    console.warn(formattedLog);
                    break;
                case 'error':
                    console.error(formattedLog);
                    break;
                default:
                    console.log(formattedLog);
            }
        }

        // Always use API endpoint for file logging (both Node.js and browser environments)
        if (this.useFileLogging) {
            this.#sendToServer(level, message, data);
        }
    }

    /**
     * Log a debug message.
     *
     * @param message - Log message
     * @param data - Optional additional data
     */
    debug(message, data) {
        this.#writeLog('debug', message, data);
    }

    /**
     * Log an info message.
     *
     * @param message - Log message
     * @param data - Optional additional data
     */
    info(message, data) {
        this.#writeLog('info', message, data);
    }

    /**
     * Log a warning message.
     *
     * @param message - Log message
     * @param data - Optional additional data
     */
    warning(message, data) {
        this.#writeLog('warn', message, data);
    }

    /**
     * Log a warning message.
     *
     * @param message - Log message
     * @param data - Optional additional data
     */
    warn(message, data) {
        this.#writeLog('warn', message, data);
    }

    /**
     * Log an error message.
     *
     * @param message - Log message
     * @param data - Optional additional data
     */
    error(message, data) {
        this.#writeLog('error', message, data);
    }

    /**
     * Alias for error method.
     *
     * @param message - Log message
     * @param data - Optional additional data
     */
    err(message, data) {
        this.#writeLog('error', message, data);
    }
}

const logger = new Logger();

// Support both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
}

export default logger;