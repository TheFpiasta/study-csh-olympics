'use client';

import React from 'react';

const ChartSectionPlaceholder = ({geojsonData}) => {
    return (
        <div
            className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                    🏟️ Headline Placeholder
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Placeholder Chart
                    </span>
                </h3>
            </div>

            {/* Placeholder Headline */}
            <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-1 text-center">
                    Sub Chart Placeholder
                </h4>
            </div>

            {/* Placeholder Content */}
            <div
                className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h5 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Chart Placeholder
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                        Venue utilization visualization will be implemented here
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChartSectionPlaceholder;