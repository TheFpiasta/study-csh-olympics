'use client';

import React, {useState, useEffect, useRef} from 'react';
import logger from '@/components/logger';

export default function MonitorPage() {
    const [logFiles, setLogFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [lastModified, setLastModified] = useState('');
    const intervalRef = useRef(null);
    const contentRef = useRef(null);

    // Load log files on component mount
    useEffect(() => {
        loadLogFiles();
    }, []);

    // Auto-refresh functionality
    useEffect(() => {
        if (autoRefresh && selectedFile) {
            intervalRef.current = setInterval(() => {
                loadFileContent(selectedFile, false);
            }, 5000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRefresh, selectedFile]);

    const loadLogFiles = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/50949303db5d468983f194e839a3b33d/monitor?action=list');
            if (!response.ok) {
                throw new Error(`Failed to load log files: ${response.status}`);
            }

            const data = await response.json();
            setLogFiles(data.files || []);

            logger.info('Loaded log files:', data.files?.length || 0);
        } catch (err) {
            setError(err.message);
            logger.error('Error loading log files:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadFileContent = async (filename, showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError(null);

            const response = await fetch(`/api/50949303db5d468983f194e839a3b33d/monitor?action=content&file=${encodeURIComponent(filename)}`);
            if (!response.ok) {
                throw new Error(`Failed to load file content: ${response.status}`);
            }

            const data = await response.json();
            setFileContent(data.content || '');
            setLastModified(data.lastModified || '');

            // Auto-scroll to bottom if content was updated
            if (contentRef.current && !showLoading) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
            }

            logger.debug('Loaded file content:', {
                filename,
                lines: data.lines,
                size: data.size
            });
        } catch (err) {
            setError(err.message);
            logger.error('Error loading file content:', err);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const downloadFile = async (filename) => {
        try {
            const response = await fetch(`/api/50949303db5d468983f194e839a3b33d/monitor?action=download&file=${encodeURIComponent(filename)}`);
            if (!response.ok) {
                throw new Error(`Failed to download file: ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            logger.info('Downloaded file:', filename);
        } catch (err) {
            setError(err.message);
            logger.error('Error downloading file:', err);
        }
    };

    const handleFileSelect = (filename) => {
        setSelectedFile(filename);
        setAutoRefresh(false);
        loadFileContent(filename);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    // Sanitize log content for display to prevent XSS
    const sanitizeLogContent = (content) => {
        if (!content) return '';

        // HTML escape and remove potentially dangerous content
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            // Remove any remaining script tags or javascript: protocols
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
            .replace(/javascript:/gi, '[JAVASCRIPT_REMOVED]')
            .replace(/on\w+\s*=/gi, '[EVENT_HANDLER_REMOVED]=');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                🔍 System Monitor
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Log file management and monitoring
                            </p>
                        </div>
                        <button
                            onClick={loadLogFiles}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            disabled={loading}
                        >
                            {loading ? '↻ Loading...' : '↻ Refresh'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-800 dark:text-red-300">Error: {error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Log Files List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            📁 Log Files ({logFiles.length})
                        </h2>

                        {logFiles.length === 0 && !loading ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                No log files found
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {logFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedFile === file.name
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                        onClick={() => handleFileSelect(file.name)}
                                    >
                                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {file.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formatFileSize(file.size)} • {formatDate(file.modified)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* File Content Viewer */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                📄 {selectedFile || 'Select a log file'}
                            </h2>

                            {selectedFile && (
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <input
                                            type="checkbox"
                                            checked={autoRefresh}
                                            onChange={(e) => setAutoRefresh(e.target.checked)}
                                            className="rounded"
                                        />
                                        Auto-refresh (5s)
                                    </label>

                                    <button
                                        onClick={() => loadFileContent(selectedFile)}
                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                                        disabled={loading}
                                    >
                                        Show Content
                                    </button>

                                    <button
                                        onClick={() => downloadFile(selectedFile)}
                                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                                    >
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>

                        {lastModified && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Last modified: {formatDate(lastModified)}
                                {autoRefresh && <span className="ml-2 text-green-600">● Live</span>}
                            </p>
                        )}

                        <div className="relative">
                            {selectedFile ? (
                                <div
                                    ref={contentRef}
                                    className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-auto whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeLogContent(fileContent) || (loading ? 'Loading...' : 'No content')
                                    }}
                                />
                            ) : (
                                <div
                                    className="bg-gray-100 dark:bg-gray-700 rounded-lg h-96 flex items-center justify-center">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Select a log file to view its content
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}