'use client';

import React, {useEffect, useState} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import LongTermSankeyPlot from "@/app/graphs/components/capacityDistribution/LongTermSankeyPlot";
import CapacityBoxPlot from "@/app/graphs/components/capacityDistribution/CapacityBoxPlot";

const CapacityDistributionAnalysis = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);

    }, [geojsonData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner/>
            </div>
        );
    }

    if (error) {
        return (
            <ShowError error={error}/>
        );
    }

    if (!data || !data.games || data.games.length === 0) {
        return (
            <ShowNoData/>
        );
    }

    return (
        <div className="space-y-8">
            <SectionHeader
                headline="Venue Capacity Distribution"
                description="Boxplot showing seating capacity distribution of Olympic venues per game."
            />

            {/* Capacity Box Plot Dashboard */}
            <div className="mx-4 mb-8">
                <CapacityBoxPlot geojsonData={geojsonData}/>
            </div>

            {/* Long Term Sankey Plot Dashboard*/}
            <div className="mx-4 mb-8">
                <LongTermSankeyPlot geojsonData={geojsonData}/>
            </div>
        </div>
    );
};

export default CapacityDistributionAnalysis;
