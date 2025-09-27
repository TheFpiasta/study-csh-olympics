'use client';

import React from 'react';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import SummerWinterRadarChart from '@/app/graphs/components/graphs/SummerWinterRadarChart';
import ContinentalVenuesBarChart from '@/app/graphs/components/graphs/ContinentalVenuesBarChart';
import DevelopmentStatusChart from '@/app/graphs/components/graphs/DevelopmentStatusChart';

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

            {/* Development Status Chart */}
            <DevelopmentStatusChart geojsonData={geojsonData} />
        </div>
    );
};

export default ComparativeAnalyses;
