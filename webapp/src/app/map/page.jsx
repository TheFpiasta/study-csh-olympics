'use client';

import Link from "next/link";
import MapWithChartsLayout from "@/app/map/components/MapWithChartsLayout";
import GlobeWithChartsLayout from "@/app/map/components/GlobeWithChartsLayout";
import ChartsPanel from "@/app/map/components/ChartsPanel";
import OlympicRings from "@/components/OlympicRings";
import { useState, useCallback, useEffect } from "react";

export default function MapPage() {
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'globe'
    const [venues, setVenues] = useState([]);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showCharts, setShowCharts] = useState(false);
    const [geojsonData, setGeojsonData] = useState(null);
    const [timelineData, setTimelineData] = useState(null);

    // Load saved view mode from session storage after hydration
    useEffect(() => {
        setIsHydrated(true);
        
        // Check if screen is mobile size
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        
        if (typeof window !== 'undefined') {
            checkMobile();
            window.addEventListener('resize', checkMobile);
            
            const savedViewMode = sessionStorage.getItem('olympics-view-mode');
            if (savedViewMode && (savedViewMode === 'map' || savedViewMode === 'globe')) {
                setViewMode(savedViewMode);
            }
            
            // Load saved chart visibility from sessionStorage
            const savedShowCharts = sessionStorage.getItem('olympics-show-charts');
            if (savedShowCharts) {
                try {
                    setShowCharts(JSON.parse(savedShowCharts));
                } catch (e) {
                    console.warn('Failed to parse saved charts state:', e);
                }
            }
            
            return () => {
                window.removeEventListener('resize', checkMobile);
            };
        }
    }, []);

    // Save view mode to session storage whenever it changes
    useEffect(() => {
        if (isHydrated && typeof window !== 'undefined') {
            sessionStorage.setItem('olympics-view-mode', viewMode);
        }
    }, [viewMode, isHydrated]);

    // Save showCharts state to sessionStorage whenever it changes
    useEffect(() => {
        if (isHydrated && typeof window !== 'undefined') {
            sessionStorage.setItem('olympics-show-charts', JSON.stringify(showCharts));
        }
    }, [showCharts, isHydrated]);

    const toggleViewMode = () => {
        setViewMode(prevMode => prevMode === 'map' ? 'globe' : 'map');
    };

    const handleDataUpdate = useCallback((data) => {
        setGeojsonData(data);
        if (data && data.features) {
            setVenues(data.features);
        }
    }, []);

    const handleChartsToggle = useCallback((show) => {
        setShowCharts(show);
    }, []);

    const handleTimelineDataUpdate = useCallback((timelineInfo) => {
        setTimelineData(timelineInfo);
    }, []);

    // Function to get status breakdown from geojson data
    const getStatusBreakdown = useCallback(() => {
        if (!geojsonData || !geojsonData.features) return [];

        const statusCounts = {};
        const statusColors = {
            'In use': '#22c55e',
            'In use (rebuilt)': '#10b981',
            'In use (repurposed)': '#06b6d4',
            'In use (seasonal)': '#3b82f6',
            'In use (limited)': '#8b5cf6',
            'Not in use': '#ef4444',
            'Not in use (demolished)': '#dc2626',
            'Dismantled (temporary)': '#991b1b',
            'Dismantled (seasonal)': '#7c2d12',
            'No status data': '#94a3b8'
        };

        geojsonData.features.forEach(feature => {
            const status = feature.properties.status || 'No status data';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return Object.entries(statusCounts)
            .map(([status, count]) => ({
                status,
                count,
                color: statusColors[status] || '#94a3b8'
            }))
            .sort((a, b) => b.count - a.count);
    }, [geojsonData]);

    return (
        <div className="min-h-screen pt-1 bg-gray-50 dark:bg-slate-900 olympic-bg">
            {/* Header */}
            <div className="relative z-10">
                <div className="p-3 mx-2 my-2 md:p-6 md:mx-4 md:my-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                        <div className="flex items-center gap-2 md:gap-4">
                            <OlympicRings size="w-8 h-8 md:w-12 md:h-12" />
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl font-bold text-gray-900 md:text-3xl lg:text-4xl dark:text-gray-200">
                                    Interactive Olympic Map
                                </h1>
                                <p className="mt-1 text-xs text-gray-700 dark:text-gray-400 md:mt-2 md:text-sm lg:text-base">
                                    Explore Olympic venues across different map layers
                                </p>
                            </div>
                        </div>
                        
                        <Link 
                            href="/" 
                            className="flex items-center justify-center gap-2 text-xs text-white btn-olympic bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 group md:text-sm lg:text-base px-3 py-2 flex-shrink-0"
                        >
                            <svg className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span className="hidden sm:inline">Back to Home</span>
                            <span className="sm:hidden">Home</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Map and Charts Container */}
            <div className="mx-2 mb-2 md:mx-4 md:mb-4">
                {/* Fixed height container for the map itself, but allows charts to extend below on mobile */}
                <div className="relative">
                    <div className="h-[500px] md:h-[600px] lg:h-[600px] relative">
                        {viewMode === 'map' ? (
                            <MapWithChartsLayout 
                                onDataUpdate={handleDataUpdate}
                                onChartsToggle={handleChartsToggle}
                                onTimelineDataUpdate={handleTimelineDataUpdate}
                                showCharts={showCharts}
                                isMobile={isMobile}
                                viewMode={viewMode}
                                toggleViewMode={toggleViewMode}
                                geojsonData={geojsonData}
                                getStatusBreakdown={getStatusBreakdown}
                                timelineData={timelineData}
                            />
                        ) : (
                            <GlobeWithChartsLayout 
                                onDataUpdate={handleDataUpdate}
                                onChartsToggle={handleChartsToggle}
                                onTimelineDataUpdate={handleTimelineDataUpdate}
                                showCharts={showCharts}
                                isMobile={isMobile}
                                viewMode={viewMode}
                                toggleViewMode={toggleViewMode}
                                geojsonData={geojsonData}
                                getStatusBreakdown={getStatusBreakdown}
                                timelineData={timelineData}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Charts Container - Only show on mobile when charts are enabled */}
            {showCharts && isMobile && (viewMode === 'map' || viewMode === 'globe') && (
                <div className="mx-2 mb-4 md:mx-4">
                    <div className="p-4 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50 min-h-[500px]">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-200">
                                        📊 Analytics Dashboard
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowCharts(false)}
                                    className="p-1.5 text-gray-400 transition-all rounded hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="w-full flex-1 overflow-visible">
                                <ChartsPanel
                                    geojsonData={geojsonData}
                                    getStatusBreakdown={getStatusBreakdown}
                                    timelineData={timelineData}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Instructions */}
            <div className="mx-2 mb-2 md:mx-4 md:mb-4">
                <div className="p-4 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50 md:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                        <div className="min-w-0 flex-1">
                            <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-200 md:text-lg">
                                🎯 Navigation Tips
                            </h2>
                            <p className="text-xs text-gray-700 dark:text-gray-400 md:text-sm lg:text-base">
                                Use map controls to switch views • Click markers for details • Zoom and pan to explore
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                            <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-full dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                                Interactive
                            </span>
                            <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-full dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                                Multi-layer
                            </span>
                            <span className="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 border border-purple-200 rounded-full dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700">
                                Historical
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}