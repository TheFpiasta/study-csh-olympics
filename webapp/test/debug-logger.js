// Debug the logger level calculation
process.env.USE_FILE_LOGGING = 'true';
process.env.USE_CONSOLE_LOGGING = 'true';
process.env.LOG_LEVEL = 'debug';

console.log('Before importing logger:');
console.log('process.env.LOG_LEVEL:', process.env.LOG_LEVEL);

// Create a minimal logger class to test the logic
class TestLogger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'warn';
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };

        console.log('In constructor:');
        console.log('this.logLevel:', this.logLevel);
        console.log('this.logLevels[this.logLevel]:', this.logLevels[this.logLevel]);
        console.log('this.logLevels.warn:', this.logLevels.warn);

        this.currentLogLevel = this.logLevels[this.logLevel] || this.logLevels.warn;

        console.log('Final currentLogLevel:', this.currentLogLevel);
    }
}

const testLogger = new TestLogger();