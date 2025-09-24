// Debug the logger level calculation more thoroughly
process.env.LOG_LEVEL = 'debug';

const logLevel = process.env.LOG_LEVEL || 'warn';
const logLevels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

console.log('logLevel:', logLevel);
console.log('logLevels[logLevel]:', logLevels[logLevel]);
console.log('logLevels.warn:', logLevels.warn);

// Test the exact expression
const result1 = logLevels[logLevel];
const result2 = logLevels.warn;
const final = result1 || result2;

console.log('result1 (logLevels[logLevel]):', result1);
console.log('result2 (logLevels.warn):', result2);
console.log('final (result1 || result2):', final);

// Test with 0
console.log('0 || 2:', 0 || 2);
console.log('Boolean(0):', Boolean(0));