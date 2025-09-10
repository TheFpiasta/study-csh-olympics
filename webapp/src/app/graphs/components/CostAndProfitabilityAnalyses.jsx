'use client';

import React, {useState, useEffect} from 'react';
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import {ResponsiveBar} from '@nivo/bar';
import {ResponsiveSankey} from '@nivo/sankey';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";

const CostAndProfitabilityAnalyses = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!geojsonData ) return;

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

            {/* Costs for venues vs. organizational costs per Olympic Games */}
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                        💰 Costs for venues vs. organizational costs per Olympic Games
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      {/*Plot type*/}
                      </span>
                    </h3>
                </div>

                {/* Placeholder Chart Area */}
                <div className="h-80 flex items-center justify-center bg-gray-100/50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center space-y-3">
                        <div className="text-4xl">📊</div>
                        <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                            Venue vs Organizational Costs Scatter Plot
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500 max-w-md">
                            This plot will visualize the relationship between venue construction costs 
                            and organizational expenses for each Olympic Games. Data implementation pending.
                        </div>
                        <div className="flex justify-center space-x-4 text-xs text-gray-400 dark:text-gray-500">
                            <span>X-axis: Venue Costs (Millions USD)</span>
                            <span>•</span>
                            <span>Y-axis: Organizational Costs (Millions USD)</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CostAndProfitabilityAnalyses;