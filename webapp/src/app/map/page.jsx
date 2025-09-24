'use client';

import Link from "next/link";
import MapWithChartsLayout from "@/app/map/components/MapWithChartsLayout";
import GlobeWithChartsLayout from "@/app/map/components/GlobeWithChartsLayout";
import OlympicRings from "@/components/OlympicRings";
import { useState, useCallback, useEffect } from "react";

export default function MapPage() {
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'globe'
    const [venues, setVenues] = useState([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Load saved view mode from session storage after hydration
    useEffect(() => {
        setIsHydrated(true);
        
        if (typeof window !== 'undefined') {
            const savedViewMode = sessionStorage.getItem('olympics-view-mode');
            if (savedViewMode && (savedViewMode === 'map' || savedViewMode === 'globe')) {
                setViewMode(savedViewMode);
            }
        }
    }, []);

    // Save view mode to session storage whenever it changes
    useEffect(() => {
        if (isHydrated && typeof window !== 'undefined') {
            sessionStorage.setItem('olympics-view-mode', viewMode);
        }
    }, [viewMode, isHydrated]);

    const toggleViewMode = () => {
        setViewMode(prevMode => prevMode === 'map' ? 'globe' : 'map');
    };

    const handleDataUpdate = useCallback((data) => {
        if (data && data.features) {
            setVenues(data.features);
        }
    }, []);

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
                        <GlobeWithChartsLayout 
                            onDataUpdate={handleDataUpdate}
                            viewMode={viewMode}
                            toggleViewMode={toggleViewMode}
                        />
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