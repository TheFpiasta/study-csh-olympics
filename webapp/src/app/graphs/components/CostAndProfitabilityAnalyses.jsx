'use client';

import React, {useState, useEffect} from 'react';
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import {ResponsiveBar} from '@nivo/bar';
import {ResponsiveSankey} from '@nivo/sankey';
import LoadingSpinner from '../../../components/LoadingSpinner';

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
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <p className="text-red-800 dark:text-red-300">Error loading data: {error}</p>
            </div>
        );
    }

    if (!data || !data.games || data.games.length === 0) {
        return (
            <div
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <p className="text-yellow-800 dark:text-yellow-300">No Olympic data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Section Header */}
            <div
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-600/20 dark:to-orange-600/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                        💰 Cost and profitability analyses
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                            Financial related analyses of Olympic venues
                      </span>
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Analyzing the financial aspects of Olympic venues, including construction costs, maintenance
                        expenses, and profitability metrics.
                    </p>
                </div>
            </div>

            {/* TODO implement graphs */}

        </div>
    );
};

export default CostAndProfitabilityAnalyses;