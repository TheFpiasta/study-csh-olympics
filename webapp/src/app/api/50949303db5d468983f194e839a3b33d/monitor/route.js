import {NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '../../../../components/logger.js';

export async function GET(request) {
    try {
        const {searchParams} = new URL(request.url);
        const action = searchParams.get('action');
        const filename = searchParams.get('file');

        // Get log directory from environment or default
        const logDirectory = process.env.LOG_DIRECTORY || 'logs';
        const logPath = path.resolve(logDirectory);

        // Ensure log directory exists
        if (!fs.existsSync(logPath)) {
            return NextResponse.json({error: 'Internal Check Error'}, {status: 500});
        }

        switch (action) {
            case 'list':
                // List all log files
                const files = fs.readdirSync(logPath)
                    .filter(file => file.endsWith('.log'))
                    .map(file => {
                        const filePath = path.join(logPath, file);
                        const stats = fs.statSync(filePath);
                        return {
                            name: file,
                            size: stats.size,
                            modified: stats.mtime.toISOString(),
                            created: stats.birthtime.toISOString()
                        };
                    })
                    .sort((a, b) => new Date(b.modified) - new Date(a.modified));

                return NextResponse.json({files});

            case 'download':
                // Download specific log file
                if (!filename) {
                    return NextResponse.json({error: 'Filename required'}, {status: 400});
                }

                const downloadPath = path.join(logPath, filename);
                if (!fs.existsSync(downloadPath) || !filename.endsWith('.log')) {
                    return NextResponse.json({error: 'File not found'}, {status: 404});
                }

                const fileContent = fs.readFileSync(downloadPath);

                return new NextResponse(fileContent, {
                    headers: {
                        'Content-Type': 'text/plain',
                        'Content-Disposition': `attachment; filename="${filename}"`,
                        'Content-Length': fileContent.length.toString()
                    }
                });

            case 'content':
                // Get file content
                if (!filename) {
                    return NextResponse.json({error: 'Filename required'}, {status: 400});
                }

                const contentPath = path.join(logPath, filename);
                if (!fs.existsSync(contentPath) || !filename.endsWith('.log')) {
                    return NextResponse.json({error: 'File not found'}, {status: 404});
                }

                const content = fs.readFileSync(contentPath, 'utf8');
                const lines = content.split('\n');

                return NextResponse.json({
                    content,
                    lines: lines.length,
                    size: content.length,
                    lastModified: fs.statSync(contentPath).mtime.toISOString()
                });

            default:
                return NextResponse.json({error: 'Invalid action'}, {status: 400});
        }

    } catch (error) {
        logger.error('Monitor API error:', error);
        return NextResponse.json({error: 'Internal server error'}, {status: 500});
    }
}