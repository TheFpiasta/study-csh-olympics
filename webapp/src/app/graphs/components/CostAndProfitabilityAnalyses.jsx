'use client';

import React, {useState, useEffect} from 'react';
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import {ResponsiveBar} from '@nivo/bar';
import {ResponsiveSankey} from '@nivo/sankey';
import {ResponsiveLine} from '@nivo/line';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import {getYearRange} from "@/app/graphs/components/utility";

const CostAndProfitabilityAnalyses = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [financialTimeData, setFinancialTimeData] = useState([]);
    const [currencyFilter, setCurrencyFilter] = useState('both');
    const [timeRangeFilter, setTimeRangeFilter] = useState('full');
    const [seasonFilter, setSeasonFilter] = useState('summer');

    useEffect(() => {
        if (!geojsonData ) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);

        // Process financial data for time-based line chart (re-run when currency filter changes)
        if (geojsonData.data && geojsonData.data.games) {
            const metrics = [
                { key: 'accredited_media', name: 'Accredited Media', format: 'number', unit: '' },
                { key: 'ticketing_revenue', name: 'Ticketing Revenue', format: 'currency', unit: 'M USD' },
                { key: 'ticketing_revenue_(usd2018)', name: 'Ticketing Revenue (2018)', format: 'currency', unit: 'M USD 2018' },
                { key: 'broadcast_revenue', name: 'Broadcast Revenue', format: 'currency', unit: 'M USD' },
                { key: 'broadcast_revenue_(usd2018)', name: 'Broadcast Revenue (2018)', format: 'currency', unit: 'M USD 2018' },
                { key: 'international_sponsorship_revenue', name: 'International Sponsorship', format: 'currency', unit: 'M USD' },
                { key: 'international_sponsorship_revenue_(usd_2018)', name: 'International Sponsorship (2018)', format: 'currency', unit: 'M USD 2018' },
                { key: 'domestic_sponsorship_revenue', name: 'Domestic Sponsorship', format: 'currency', unit: 'M USD' },
                { key: 'domestic_sponsorship_revenue_(usd_2018)', name: 'Domestic Sponsorship (2018)', format: 'currency', unit: 'M USD 2018' },
                { key: 'cost_of_venues', name: 'Cost of Venues', format: 'currency', unit: 'M USD' },
                { key: 'cost_of_venues_(usd_2018)', name: 'Cost of Venues (2018)', format: 'currency', unit: 'M USD 2018' },
                { key: 'cost_of_organisation', name: 'Cost of Organisation', format: 'currency', unit: 'M USD' },
                { key: 'cost_of_organisation_(usd_2018)', name: 'Cost of Organisation (2018)', format: 'currency', unit: 'M USD 2018' }
            ];

            const filteredMetrics = metrics.filter(metric => {
                if (currencyFilter === 'normal') {
                    return !metric.key.includes('2018') && !metric.key.includes('usd2018');
                } else if (currencyFilter === '2018') {
                    return metric.key.includes('2018') || metric.key.includes('usd2018') || metric.format === 'number';
                }
                return true; // both - show all metrics
            });

            const processedData = filteredMetrics.map(metric => ({
                id: metric.name,
                data: geojsonData.data.games
                    .filter(game => {
                        const harvard = game.harvard;
                        // Get season from first venue (Harvard games have only one season)
                        const gameSeason = game.features && game.features.length > 0 ? 
                                         game.features[0].properties.season : null;
                        
                        // Filter by season and data availability
                        return harvard && 
                               harvard[metric.key] && 
                               harvard[metric.key].data &&
                               gameSeason && 
                               gameSeason.toLowerCase() === seasonFilter.toLowerCase();
                    })
                    .map(game => {
                        const harvard = game.harvard;
                        const rawData = harvard[metric.key].data;
                        
                        // Parse and validate the numeric value
                        let value = parseFloat(rawData);
                        
                        // Skip if value is not a valid number
                        if (isNaN(value) || !isFinite(value)) {
                            return null;
                        }
                        
                        // Convert currency values to millions
                        if (metric.format === 'currency') {
                            value = value / 1000000;
                        }
                        
                        // Validate year
                        const year = parseInt(game.year);
                        if (isNaN(year)) {
                            return null;
                        }
                        
                        // Get season from first venue
                        const gameSeason = game.features && game.features.length > 0 ? 
                                         game.features[0].properties.season : 'Unknown';
                        
                        return {
                            x: year,
                            y: value,
                            location: game.location,
                            season: gameSeason,
                            rawValue: rawData,
                            unit: metric.unit,
                            metric: metric.name
                        };
                    })
                    .filter(dataPoint => dataPoint !== null) // Remove invalid data points
                    .sort((a, b) => a.x - b.x)
            })).filter(series => series.data.length > 0);

            setFinancialTimeData(processedData);
        }
    }, [geojsonData, currencyFilter, seasonFilter]);

    // Get the time range for financial data only
    const getFinancialDataTimeRange = () => {
        if (!financialTimeData || financialTimeData.length === 0) return { min: 'auto', max: 'auto' };
        
        const allYears = financialTimeData.flatMap(series => series.data.map(point => point.x));
        if (allYears.length === 0) return { min: 'auto', max: 'auto' };
        
        return {
            min: Math.min(...allYears),
            max: Math.max(...allYears)
        };
    };

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
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                        📈 Financial Metrics Over Time
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                            Line Chart
                        </span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Time Range:</span>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setTimeRangeFilter('full')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    timeRangeFilter === 'full'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Full Timeline
                            </button>
                            <button
                                onClick={() => setTimeRangeFilter('data')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    timeRangeFilter === 'data'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Data Range
                            </button>
                        </div>
                    </div>
                </div>

                {/* Olympic Season Filter */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Olympic Season
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSeasonFilter('summer')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                seasonFilter === 'summer'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Summer
                        </button>
                        <button
                            onClick={() => setSeasonFilter('winter')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                seasonFilter === 'winter'
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Winter
                        </button>
                    </div>
                </div>

                {/* Currency Filter */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setCurrencyFilter('both')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                currencyFilter === 'both'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Both Types
                        </button>
                        <button
                            onClick={() => setCurrencyFilter('normal')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                currencyFilter === 'normal'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Original Currency
                        </button>
                        <button
                            onClick={() => setCurrencyFilter('2018')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                currencyFilter === '2018'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            2018 USD
                        </button>
                    </div>
                </div>

                <div className="h-96 chart-container">
                    <style jsx>{`
                        .chart-container :global(text) {
                            fill: #d1d5db !important;
                            font-weight: 600 !important;
                        }
                    `}</style>
                    <ResponsiveLine
                        data={financialTimeData}
                        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                        xScale={{ 
                            type: 'linear', 
                            min: timeRangeFilter === 'full' ? (data ? getYearRange(data).min : 'auto') : getFinancialDataTimeRange().min,
                            max: timeRangeFilter === 'full' ? (data ? getYearRange(data).max : 'auto') : getFinancialDataTimeRange().max
                        }}
                        yScale={{
                            type: 'linear',
                            min: 'auto',
                            max: 'auto',
                            stacked: false,
                            reverse: false
                        }}
                        yFormat=" >-.2f"
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            orient: 'bottom',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Year',
                            legendOffset: 36,
                            legendPosition: 'middle'
                        }}
                        axisLeft={{
                            orient: 'left',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Value',
                            legendOffset: -40,
                            legendPosition: 'middle'
                        }}
                        pointSize={10}
                        pointColor={{ from: 'serieColor' }}
                        pointBorderWidth={2}
                        pointBorderColor="#ffffff"
                        enablePointLabel={false}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        tooltip={({ point }) => (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80">
                                <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {point.data.location} {point.data.x}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {point.data.season} Olympics
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Metric:</span>
                                        <span className="text-gray-900 dark:text-gray-100">{point.data.metric}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Value:</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-bold">
                                            {point.data.unit.includes('M') ? 
                                                `${point.data.yFormatted} ${point.data.unit}` : 
                                                `${parseInt(point.data.rawValue).toLocaleString()}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        legends={[]}
                        theme={{
                            background: 'transparent',
                            grid: {
                                line: {
                                    stroke: '#374151',
                                    strokeWidth: 1
                                }
                            },
                            tooltip: {
                                container: {
                                    background: '#ffffff',
                                    color: '#374151',
                                    fontSize: '12px',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    border: '1px solid #e5e7eb',
                                    padding: '8px 12px'
                                }
                            },
                            axis: {
                                ticks: {
                                    text: {
                                        fontSize: 11,
                                        fill: '#d1d5db',
                                        fontWeight: 600
                                    }
                                },
                                legend: {
                                    text: {
                                        fontSize: 12,
                                        fill: '#d1d5db',
                                        fontWeight: 600
                                    }
                                }
                            },
                            legends: {
                                text: {
                                    fill: '#d1d5db',
                                    fontSize: 11
                                }
                            }
                        }}
                    />
                </div>

                {/* Custom Legend */}
                <div className="flex justify-center mt-4 flex-wrap gap-4">
                    {financialTimeData.map((series, index) => (
                        <div key={series.id} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{backgroundColor: `hsl(${index * 360 / financialTimeData.length}, 70%, 50%)`}}
                            ></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                {series.id}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default CostAndProfitabilityAnalyses;