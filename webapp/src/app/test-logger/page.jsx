'use client';

import {useEffect} from 'react';
import logger from '../../components/logger.js';

export default function TestLoggerPage() {
    useEffect(() => {
        console.log('=== Logger Test in Next.js Browser Environment ===');

        // Log the logger configuration
        console.log('Logger configuration:', {
            logLevel: logger.logLevel,
            currentLogLevel: logger.currentLogLevel,
            useConsoleLogging: logger.useConsoleLogging,
            useFileLogging: logger.useFileLogging
        });

        // Test all log levels
        logger.debug('Debug message from Next.js component');
        logger.info('Info message from Next.js component');
        logger.warn('Warning message from Next.js component');
        logger.error('Error message from Next.js component');

        console.log('=== End Logger Test ===');
    }, []);

    const testLogger = () => {
        console.log('=== Manual Logger Test ===');
        logger.debug('Manual debug test');
        logger.info('Manual info test', {timestamp: new Date().toISOString()});
        logger.warn('Manual warning test');
        logger.error('Manual error test', {error: 'test error data'});
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Logger Test Page</h1>
            <p className="mb-4">
                Open the browser console to see log messages. The logger should automatically
                run when this page loads.
            </p>

            <button
                onClick={testLogger}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Test Logger Manually
            </button>

            <div className="mt-4 p-4 bg-gray-100 rounded">
                <h2 className="font-bold mb-2">Expected Behavior:</h2>
                <ul className="list-disc pl-5">
                    <li>Debug messages should appear (default level is 'info' in browser)</li>
                    <li>Info messages should appear</li>
                    <li>Warning messages should appear</li>
                    <li>Error messages should appear</li>
                    <li>Console logging should be enabled by default in browser</li>
                </ul>
            </div>
        </div>
    );
}