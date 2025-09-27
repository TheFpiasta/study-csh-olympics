'use client';

import React from 'react';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import SummerWinterRadarChart from '@/app/graphs/components/SummerWinterRadarChart';
import ContinentalVenuesBarChart from '@/app/graphs/components/ContinentalVenuesBarChart';
import DevelopmentStatusChart from '@/app/graphs/components/DevelopmentStatusChart';

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