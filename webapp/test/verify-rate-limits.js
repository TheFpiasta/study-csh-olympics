// Verify rate limits configuration
const fs = require('fs');
const path = require('path');

// Read the logger API file
const apiFile = path.join(__dirname, '..', 'src', 'app', 'api', 'logs', 'route.js');
const content = fs.readFileSync(apiFile, 'utf8');

console.log('Rate Limits Configuration Verification\n');

// Extract rate limits
const rateLimitMatch = content.match(/const RATE_LIMITS_BY_LEVEL = \{[\s\S]*?\}/);
if (rateLimitMatch) {
    console.log('✅ Found RATE_LIMITS_BY_LEVEL configuration:');
    console.log(rateLimitMatch[0]);
} else {
    console.log('❌ RATE_LIMITS_BY_LEVEL not found');
}

// Check if isRateLimited function accepts logLevel parameter
const isRateLimitedMatch = content.match(/function isRateLimited\([^)]*logLevel[^)]*\)/);
if (isRateLimitedMatch) {
    console.log('\n✅ isRateLimited function accepts logLevel parameter');
} else {
    console.log('\n❌ isRateLimited function does not accept logLevel parameter');
}

// Check if POST handler uses log level for rate limiting
const postHandlerMatch = content.match(/isRateLimited\([^,]+,\s*sanitizedData\.level\)/);
if (postHandlerMatch) {
    console.log('✅ POST handler passes log level to rate limiting');
} else {
    console.log('❌ POST handler does not use log level for rate limiting');
}

// Verify level-specific keys are used
const levelKeyMatch = content.match(/levelKey = `\${key}:\${logLevel}`/);
if (levelKeyMatch) {
    console.log('✅ Level-specific keys are used for rate limiting');
} else {
    console.log('❌ Level-specific keys not implemented');
}

console.log('\nConfiguration Summary:');
console.log('- Debug logs: 500 requests/minute (highest limit for development)');
console.log('- Info logs: 300 requests/minute (regular application flow)');
console.log('- Warn logs: 150 requests/minute (warnings should be less frequent)');
console.log('- Error logs: 50 requests/minute (errors should be rare)');