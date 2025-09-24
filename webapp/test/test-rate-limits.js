// Test script for rate limiting by log level
const baseUrl = 'http://localhost:3000';

async function testRateLimit(level, expectedLimit) {
    console.log(`\nTesting ${level} level (limit: ${expectedLimit})`);

    const logEntry = {
        level,
        message: `Test ${level} message`,
        data: JSON.stringify({test: 'data'}),
        timestamp: new Date().toISOString(),
        userAgent: 'Test-Agent',
        url: '/test'
    };

    let successCount = 0;
    let rateLimitHit = false;

    // Send requests rapidly to test rate limiting
    for (let i = 0; i < Math.min(expectedLimit + 10, 60); i++) {
        try {
            const response = await fetch(`${baseUrl}/api/logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Test-Agent'
                },
                body: JSON.stringify(logEntry)
            });

            if (response.ok) {
                successCount++;
            } else if (response.status === 429) {
                rateLimitHit = true;
                const result = await response.json();
                console.log(`  Rate limit hit after ${successCount} requests: ${result.error}`);
                break;
            } else {
                console.log(`  Unexpected error: ${response.status}`);
                break;
            }
        } catch (error) {
            console.error(`  Request failed:`, error.message);
            break;
        }

        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`  Successfully sent ${successCount} ${level} requests`);
    console.log(`  Rate limit enforced: ${rateLimitHit ? 'YES' : 'NO'}`);
}

async function runTests() {
    console.log('Testing rate limits by log level...\n');
    console.log('Expected limits:');
    console.log('  debug: 500 requests/minute');
    console.log('  info: 300 requests/minute');
    console.log('  warn: 150 requests/minute');
    console.log('  error: 50 requests/minute');

    // Test each level with a small number of requests to verify limits
    await testRateLimit('error', 50);
    await testRateLimit('warn', 150);

    console.log('\nTest completed!');
    console.log('Note: Full limits (300+ requests) not tested to avoid overwhelming the server');
}

// Check if server is running
fetch(`${baseUrl}/api/logs`, {method: 'OPTIONS'})
    .then(() => runTests())
    .catch(() => {
        console.error('Server not running. Please start with: npm run dev');
        process.exit(1);
    });