// Test script for the refactored logger
// Set environment variables for testing first
process.env.USE_FILE_LOGGING = 'true';
process.env.USE_CONSOLE_LOGGING = 'true';
process.env.LOG_LEVEL = 'debug';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

const loggerModule = require('./src/components/logger.js');
const logger = loggerModule.default || loggerModule;

console.log('Testing refactored logger...');
console.log('Logger object:', logger);
console.log('Logger methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(logger)));
console.log('File logging enabled:', process.env.USE_FILE_LOGGING);
console.log('Console logging enabled:', process.env.USE_CONSOLE_LOGGING);

// Test different log levels
if (typeof logger.debug === 'function') {
    logger.debug('Debug message test', {test: 'data'});
    logger.info('Info message test', {user: 'test_user'});
    logger.warn('Warning message test');
    logger.error('Error message test', {error: 'test error'});
} else {
    console.log('Logger methods not available, logger type:', typeof logger);
}

console.log('Logger test completed.');