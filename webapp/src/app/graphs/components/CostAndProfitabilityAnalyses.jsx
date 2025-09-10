'use client';

import React, {useState, useEffect, useRef} from 'react';
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
    const [allMetricFilters, setAllMetricFilters] = useState({});
    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (!geojsonData ) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);

        // Initialize metric filters on first load only
        if (geojsonData.data && geojsonData.data.games && initialLoadRef.current) {
            // Dynamically extract all available Harvard financial metrics
            const extractMetricsFromData = () => {
                const metricsSet = new Set();
                
                geojsonData.data.games.forEach(game => {
                    if (game.harvard) {
                        Object.keys(game.harvard).forEach(key => {
                            if (game.harvard[key] && game.harvard[key].data) {
                                metricsSet.add(key);
                            }
                        });
                    }
                });
                
                return Array.from(metricsSet).map(key => {
                    // Generate human-readable name from key
                    let name = key
                        .replace(/_/g, ' ')
                        .replace(/\(usd2018\)/g, '(2018)')
                        .replace(/\(usd_2018\)/g, '(2018)')
                        .replace(/\b\w/g, l => l.toUpperCase());
                    
                    // Determine format and unit based on key patterns
                    const isCurrency = key.includes('revenue') || key.includes('cost');
                    const is2018 = key.includes('2018') || key.includes('usd2018');
                    
                    return {
                        key: key,
                        name: name,
                        format: isCurrency ? 'currency' : 'number',
                        unit: isCurrency ? (is2018 ? 'M USD 2018' : 'M USD') : ''
                    };
                });
            };
            
            const metrics = extractMetricsFromData();
            const globalFilters = {};
            metrics.forEach(metric => {
                globalFilters[metric.name] = {
                    active: true,  // Default: all filters active
                    visible: true,  // Will be updated by separate useEffect
                    key: metric.key,
                    format: metric.format,
                    unit: metric.unit
                };
            });
            setAllMetricFilters(globalFilters);
            initialLoadRef.current = false;
        }
    }, [geojsonData]);

    // Process financial data when filters change
    useEffect(() => {
        if (!data || !data.games || Object.keys(allMetricFilters).length === 0) return;

        // Extract metrics info from allMetricFilters
        const filteredMetrics = Object.keys(allMetricFilters)
            .filter(metricName => {
                const filterState = allMetricFilters[metricName];
                return filterState && filterState.active && filterState.visible;
            })
            .map(metricName => ({
                key: allMetricFilters[metricName].key,
                name: metricName,
                format: allMetricFilters[metricName].format,
                unit: allMetricFilters[metricName].unit
            }));

        const processedData = filteredMetrics.map(metric => ({
            id: metric.name,
            data: data.games
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
    }, [data, allMetricFilters, seasonFilter]);

    // Separate useEffect to handle metric filter visibility updates when currency changes
    useEffect(() => {
        if (!data || !data.games || Object.keys(allMetricFilters).length === 0) return;

        setAllMetricFilters(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(metricName => {
                const filterInfo = updated[metricName];
                if (filterInfo) {
                    const isCurrency = filterInfo.key.includes('revenue') || filterInfo.key.includes('cost');
                    const is2018 = filterInfo.key.includes('2018') || filterInfo.key.includes('usd2018');
                    
                    let visible = true;
                    if (currencyFilter === 'normal') {
                        visible = !filterInfo.key.includes('2018') && !filterInfo.key.includes('usd2018');
                    } else if (currencyFilter === '2018') {
                        visible = filterInfo.key.includes('2018') || filterInfo.key.includes('usd2018') || !isCurrency;
                    }
                    
                    updated[metricName] = {
                        ...updated[metricName],
                        visible: visible
                    };
                }
            });
            return updated;
        });
    }, [currencyFilter, data]);

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

    // Get visible metrics for UI
    const getVisibleMetrics = () => {
        return Object.keys(allMetricFilters)
            .filter(name => allMetricFilters[name].visible)
            .sort();
    };

    // Get color for a metric based on its index in the visible metrics list
    const getMetricColor = (metricName) => {
        const visibleMetrics = getVisibleMetrics();
        const index = visibleMetrics.indexOf(metricName);
        return `hsl(${index * 360 / visibleMetrics.length}, 70%, 50%)`;
    };

    // Toggle metric active state
    const toggleMetricSelection = (metricName) => {
        setAllMetricFilters(prev => ({
            ...prev,
            [metricName]: {
                ...prev[metricName],
                active: !prev[metricName].active
            }
        }));
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

                {/* Financial Metrics Selection Filter */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Financial Metrics
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {getVisibleMetrics().map((metricName) => {
                            const filterState = allMetricFilters[metricName];
                            return (
                                <button
                                    key={metricName}
                                    onClick={() => toggleMetricSelection(metricName)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
                                        filterState && filterState.active
                                            ? 'text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                    style={{
                                        backgroundColor: filterState && filterState.active
                                            ? getMetricColor(metricName)
                                            : undefined
                                    }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{backgroundColor: getMetricColor(metricName)}}
                                    ></div>
                                    {metricName}
                                </button>
                            );
                        })}
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
                        colors={(serie) => getMetricColor(serie.id)}
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
                    {financialTimeData.map((series) => (
                        <div key={series.id} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{backgroundColor: getMetricColor(series.id)}}
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