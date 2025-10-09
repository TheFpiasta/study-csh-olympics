'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import MapWithLayers from './MapWithLayers';
import ChartsPanel from './ChartsPanel';
import logger from '@/components/logger';

const MapWithChartsLayout = ({
    onDataUpdate, 
    onChartsToggle, 
    onTimelineDataUpdate, 
    showCharts, 
    isMobile, 
    viewMode, 
    toggleViewMode,
    geojsonData,
    getStatusBreakdown,
    timelineData
}) => {
    // Hydration-safe state
    const [isHydrated, setIsHydrated] = useState(false);

    // Resizable state (only for desktop)
    const [mapWidth, setMapWidth] = useState(66.67); // Start at 2/3 (66.67%)
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    // Minimum widths (percentage)
    const MIN_MAP_WIDTH = 30;
    const MIN_CHARTS_WIDTH = 20;

    // Hydration effect - load saved values after component mounts
    useEffect(() => {
        setIsHydrated(true);

        if (typeof window !== 'undefined') {
            // Load saved map width from sessionStorage
            const savedMapWidth = sessionStorage.getItem('olympics-map-width');
            if (savedMapWidth) {
                try {
                    const width = parseFloat(savedMapWidth);
                    if (width >= MIN_MAP_WIDTH && width <= (100 - MIN_CHARTS_WIDTH)) {
                        setMapWidth(width);
                    }
                } catch (e) {
                    logger.warn('Failed to parse saved map width:', e);
                }
            }
        }
    }, []);

    // This function will be passed to MapWithLayers to get data updates
    const handleDataUpdate = useCallback((data) => {
        // Pass data up to parent component
        if (onDataUpdate) {
            onDataUpdate(data);
        }
    }, [onDataUpdate]);

    // This function will be passed to MapWithLayers to handle chart toggle
    const handleChartsToggle = useCallback((show) => {
        if (onChartsToggle) {
            onChartsToggle(show);
        }
    }, [onChartsToggle]);

    // This function will be passed to MapWithLayers to get timeline data updates
    const handleTimelineDataUpdate = useCallback((timelineInfo) => {
        if (onTimelineDataUpdate) {
            onTimelineDataUpdate(timelineInfo);
        }
    }, [onTimelineDataUpdate]);

    // Save mapWidth state to sessionStorage whenever it changes (only after hydration)
    useEffect(() => {
        if (isHydrated && typeof window !== 'undefined') {
            sessionStorage.setItem('olympics-map-width', mapWidth.toString());
        }
    }, [mapWidth, isHydrated]);

    // Handle mouse/touch events for resizing (disabled on mobile)
    const handleMouseDown = useCallback((e) => {
        if (!showCharts || isMobile) return;
        setIsDragging(true);
        e.preventDefault();
    }, [showCharts, isMobile]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !containerRef.current || !showCharts || isMobile) return;

        e.preventDefault();
        const containerRect = containerRef.current.getBoundingClientRect();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const newMapWidth = ((clientX - containerRect.left) / containerRect.width) * 100;

        // Apply constraints
        const constrainedWidth = Math.max(
            MIN_MAP_WIDTH,
            Math.min(100 - MIN_CHARTS_WIDTH, newMapWidth)
        );

        setMapWidth(constrainedWidth);
    }, [isDragging, showCharts, isMobile]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add global event listeners for mouse/touch events
    useEffect(() => {
        if (isDragging) {
            const handleMove = (e) => handleMouseMove(e);
            const handleUp = () => handleMouseUp();

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
            document.addEventListener('touchmove', handleMove, {passive: false});
            document.addEventListener('touchend', handleUp);

            return () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
                document.removeEventListener('touchmove', handleMove);
                document.removeEventListener('touchend', handleUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className={`flex lg:flex-row h-full max-h-full relative ${isDragging ? 'resizing no-select' : ''}`}
        >
            {/* Map Container - Full height always, dynamic width only on desktop */}
            <div
                className="flex flex-col w-full h-full p-2 overflow-hidden transition-none border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50"
                style={{
                    // Only apply dynamic width on desktop when charts are shown
                    width: !isMobile && showCharts ? `${mapWidth}%` : undefined
                }}
            >
                <div className="flex-1 w-full min-h-0 overflow-hidden map-container rounded-xl">
                    <MapWithLayers
                        onDataUpdate={handleDataUpdate}
                        onChartsToggle={handleChartsToggle}
                        onTimelineDataUpdate={handleTimelineDataUpdate}
                        showCharts={showCharts}
                        viewMode={viewMode}
                        toggleViewMode={toggleViewMode}
                    />
                </div>
            </div>

            {/* Resizer Handle - Only show when charts are visible and on desktop */}
            {showCharts && !isMobile && (
                <div
                    className={`
                        w-1 bg-gray-600 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-500
                        cursor-col-resize transition-all duration-200 flex-shrink-0 mx-2 group rounded-full
                        shadow-sm hover:shadow-md active:shadow-lg
                        ${isDragging ? 'bg-gray-800 dark:bg-gray-500 shadow-lg' : ''}
                    `}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    title="Drag to resize panels"
                >
                    {/* Visual handle indicator */}
                    <div className="relative flex items-center justify-center w-full h-full">
                        <div className="flex flex-col gap-0.5">
                            <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-400 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-200"></div>
                            <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-400 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-200"></div>
                            <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-400 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-200"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Container - Desktop only (side-by-side) */}
            {showCharts && !isMobile && (
                <div
                    className="h-full p-4 transition-none border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50"
                    style={{
                        width: `${100 - mapWidth}%`
                    }}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                                    📊 Analytics Dashboard
                                </h2>
                            </div>
                            <button
                                onClick={() => {
                                    if (onChartsToggle) {
                                        onChartsToggle(false);
                                    }
                                }}
                                className="p-2 text-gray-400 transition-all rounded hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ChartsPanel
                                geojsonData={geojsonData}
                                getStatusBreakdown={getStatusBreakdown}
                                timelineData={timelineData}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapWithChartsLayout;
