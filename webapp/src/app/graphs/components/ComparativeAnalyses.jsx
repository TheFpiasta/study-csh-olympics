'use client';

import React from 'react';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import SummerWinterRadarChart from '@/app/graphs/components/SummerWinterRadarChart';
import ContinentalVenuesBarChart from '@/app/graphs/components/ContinentalVenuesBarChart';

const ComparativeAnalyses = ({ geojsonData }) => {
    return (
        <div className="space-y-8">
            <SectionHeader 
                headline="📊 Comparative Analyses"
                description="Multi-dimensional analysis comparing different aspects of Olympic Games: seasonal efficiency, continental venue patterns, and legacy outcomes"
            />
            
            {/* Summer vs Winter Radar Chart */}
            <SummerWinterRadarChart geojsonData={geojsonData} />
            
            {/* Continental Venues Bar Chart */}
            <ContinentalVenuesBarChart geojsonData={geojsonData} />
            
            {/* Placeholder for third chart */}
            <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-6">
                    🏆 Third Chart Placeholder
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Awaiting Specification
                    </span>
                </h3>
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🚧</div>
                        <p className="text-gray-500 dark:text-gray-400">Third chart component ready for implementation</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Specify chart type and requirements</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparativeAnalyses;