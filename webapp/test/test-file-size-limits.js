// Test script for rotation period-based file size limits
const fs = require('fs');
const path = require('path');

// Read the API file to verify the implementation
const apiFile = path.join(__dirname, '..', 'src', 'app', 'api', 'logs', 'route.js');
const content = fs.readFileSync(apiFile, 'utf8');

console.log('File Size Limits Configuration Verification\n');

// Extract file size limits configuration
const fileSizeLimitsMatch = content.match(/const FILE_SIZE_LIMITS = \{[\s\S]*?\}/);
if (fileSizeLimitsMatch) {
    console.log('✅ Found FILE_SIZE_LIMITS configuration:');
    console.log(fileSizeLimitsMatch[0]);
} else {
    console.log('❌ FILE_SIZE_LIMITS configuration not found');
}

// Check if getMaxLogFileSize function exists
const getMaxFileSizeMatch = content.match(/function getMaxLogFileSize\(\)/);
if (getMaxFileSizeMatch) {
    console.log('\n✅ getMaxLogFileSize function found');
} else {
    console.log('\n❌ getMaxLogFileSize function not found');
}

// Check if dynamic file size check is implemented
const dynamicCheckMatch = content.match(/const maxFileSize = getMaxLogFileSize\(\)/);
if (dynamicCheckMatch) {
    console.log('✅ Dynamic file size check implemented');
} else {
    console.log('❌ Dynamic file size check not implemented');
}

// Check if error message includes rotation period
const errorMessageMatch = content.match(/error: `Log file size limit exceeded \(\$\{sizeMB\}MB for \$\{rotationPeriod\} rotation\)/);
if (errorMessageMatch) {
    console.log('✅ Error message includes rotation period information');
} else {
    console.log('❌ Error message does not include rotation period information');
}

console.log('\nFile Size Limits by Rotation Period:');
console.log('- Daily rotation: 10MB (files rotate every day)');
console.log('- Weekly rotation: 50MB (files rotate every week)');
console.log('- Monthly rotation: 100MB (files rotate every month)');

console.log('\nCurrent configuration (from .env):');
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const rotationMatch = envContent.match(/LOG_ROTATION_PERIOD="?([^"#\n]*)"?/);
    if (rotationMatch) {
        const period = rotationMatch[1];
        const limits = {
            daily: '10MB',
            weekly: '50MB',
            monthly: '100MB'
        };
        console.log(`LOG_ROTATION_PERIOD: ${period}`);
        console.log(`Current file size limit: ${limits[period] || '50MB (default)'}`);
    }
}