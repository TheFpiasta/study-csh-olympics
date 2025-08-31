'use client';

import Link from "next/link";
import MapWithChartsLayout from "@/components/MapWithChartsLayout";
import GlobeView from "@/components/GlobeView";
import OlympicRings from "@/components/OlympicRings";
import { useState } from "react";

export default function MapPage() {
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'globe'
    const [venues, setVenues] = useState([]);

    const toggleViewMode = () => {
        setViewMode(prevMode => prevMode === 'map' ? 'globe' : 'map');
    };

    const handleDataUpdate = (data) => {
        if (data && data.features) {
            setVenues(data.features);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 olympic-bg">
            {/* Header */}
            <div className="relative z-10">
                <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm mx-4 my-4 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <OlympicRings size="w-12 h-12" />
                            <div>
                                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-200">
                                    Interactive Olympic Map
                                </h1>
                                <p className="text-gray-700 dark:text-gray-400 mt-2 text-sm md:text-base">
                                    Explore Olympic venues across different map layers and discover their historical significance
                                </p>
                            </div>
                        </div>
                        
                        <Link 
                            href="/" 
                            className="btn-olympic bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white group flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Map and Charts Container */}
            <div className="mx-4 mb-4">
                <div className="h-[600px] relative">
                    {viewMode === 'map' ? (
                        <MapWithChartsLayout 
                            onDataUpdate={handleDataUpdate} 
                            viewMode={viewMode}
                            toggleViewMode={toggleViewMode}
                        />
                    ) : (
                        <div className="h-full bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-600/50 shadow-lg overflow-hidden relative">
                            {/* Globe View Control Button - positioned like other map controls */}
                            <div className="absolute space-y-2 top-4 left-4 z-10">
                                <button
                                    onClick={toggleViewMode}
                                    className="block p-3 transition-all duration-300 shadow-lg glass rounded-xl hover:scale-105"
                                    title="Switch to Map View"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
                                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2"></polygon>
                                        <line x1="8" y1="2" x2="8" y2="18"></line>
                                        <line x1="16" y1="6" x2="16" y2="22"></line>
                                    </svg>
                                </button>
                            </div>
                            <GlobeView venues={venues} />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Instructions */}
            <div className="mx-4 mb-4">
                <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">
                                🎯 Navigation Tips
                            </h2>
                            <p className="text-gray-700 dark:text-gray-400 text-sm md:text-base">
                                Use map layer controls to switch views • Click on venue markers for detailed information • Zoom and pan to explore different regions
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-700">
                                Interactive
                            </span>
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium border border-green-200 dark:border-green-700">
                                Multi-layer
                            </span>
                            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-700">
                                Historical Data
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}