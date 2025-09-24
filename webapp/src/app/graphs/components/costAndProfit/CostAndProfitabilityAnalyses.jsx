'use client';

import React, {useState, useEffect} from 'react';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import ChartSectionPlaceholder from "../templates/ChartSectionPlaceholder";
import FinancialMetrics from "@/app/graphs/components/costAndProfit/FinancialMetrics";
import FinancialScatterPlot from "@/app/graphs/components/costAndProfit/FinancialScatterPlot";

const CostAndProfitabilityAnalyses = ({geojsonData}) => {
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
            <SectionHeader headline={"💰 Cost and profitability analyses"}
                           description={"Analyzing the financial aspects of Olympic venues, including construction costs, maintenance expenses, and profitability metrics."}
            />
            {/* Financial Metrics Over Time */}
            <FinancialMetrics data={data}/>

            {/* Financial Metrics Correlation ScatterPlot */}
            <FinancialScatterPlot data={data}/>
        </div>
    );
};

export default CostAndProfitabilityAnalyses;