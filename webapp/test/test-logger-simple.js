// Simple test for the refactored logger
process.env.USE_FILE_LOGGING = 'true';
process.env.USE_CONSOLE_LOGGING = 'true';
process.env.LOG_LEVEL = 'debug';

console.log('Environment variables:');
console.log('LOG_LEVEL:', process.env.LOG_LEVEL);
console.log('USE_FILE_LOGGING:', process.env.USE_FILE_LOGGING);
console.log('USE_CONSOLE_LOGGING:', process.env.USE_CONSOLE_LOGGING);

// Import after setting env vars
delete require.cache[require.resolve('../src/components/logger.js')];
const loggerModule = require('../src/components/logger.js');
const logger = loggerModule.default || loggerModule;

console.log('\nLogger configuration:');
console.log('logLevel:', logger.logLevel);
console.log('currentLogLevel:', logger.currentLogLevel);
console.log('useFileLogging:', logger.useFileLogging);
console.log('useConsoleLogging:', logger.useConsoleLogging);

console.log('\nTesting all log levels:');
logger.debug('Debug message - should appear');
logger.info('Info message - should appear');
logger.warn('Warning message - should appear');
logger.error('Error message - should appear');

console.log('\nTest completed.');
console.log('Note: File logging via API requires the Next.js server to be running.');