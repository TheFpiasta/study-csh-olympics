'use client';

import React, {useState, useEffect} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import ChartSectionPlaceholder from "../templates/ChartSectionPlaceholder";
import FinancialMetrics from "@/app/graphs/components/costAndProfit/FinancialMetrics";
import FinancialScatterPlot from "@/app/graphs/components/costAndProfit/FinancialScatterPlot";
import TemporalDevelopmentAnalyses from "@/app/graphs/components/temporalDevelopmnent/TemporalDevelopmentAnalyses";
import CostAndProfitabilityAnalyses from "@/app/graphs/components/costAndProfit/CostAndProfitabilityAnalyses";
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