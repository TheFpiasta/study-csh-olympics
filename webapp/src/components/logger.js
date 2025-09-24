const fs = require('fs');
const path = require('path');

/**
 * Logger class to handle logging to console and/or file with different log levels and rotation.
 * Configuration is done via environment variables.
 */
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'warn';
        this.useFileLogging = process.env.USE_FILE_LOGGING === 'true';
        this.useConsoleLogging = process.env.USE_CONSOLE_LOGGING === 'true';
        this.logDirectory = process.env.LOG_DIRECTORY || 'logs';
        this.logRotationPeriod = process.env.LOG_ROTATION_PERIOD || 'weekly';

        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        this.currentLogLevel = this.logLevels[this.logLevel] || this.logLevels.warn;

        if (this.useFileLogging) {
            this.#ensureLogDirectory();
        }
    }

    /**
     * Ensure the log directory exists, create if it doesn't.
     */
    #ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logDirectory)) {
                fs.mkdirSync(this.logDirectory, {recursive: true});
            }
        } catch (error) {
            console.error(`Failed to create log directory: ${error.message}`);
            this.useFileLogging = false;
        }
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
     * Get log file name based on rotation period.
     *
     * @returns {string} - Log file name
     */
    #getLogFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        switch (this.logRotationPeriod) {
            case 'daily':
                return `app-${year}-${month}-${day}.log`;
            case 'weekly':
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const weekYear = startOfWeek.getFullYear();
                const weekMonth = String(startOfWeek.getMonth() + 1).padStart(2, '0');
                const weekDay = String(startOfWeek.getDate()).padStart(2, '0');
                return `app-${weekYear}-${weekMonth}-${weekDay}-week.log`;
            case 'monthly':
                return `app-${year}-${month}.log`;
            default:
                return `app-${year}-${month}-${day}.log`;
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

        if (this.useFileLogging) {
            try {
                const logFile = path.join(this.logDirectory, this.#getLogFileName());
                fs.appendFileSync(logFile, formattedLog + '\n');
            } catch (error) {
                console.error(`Failed to write to log file: ${error.message}`);
            }
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

module.exports = logger;