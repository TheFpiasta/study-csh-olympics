'use client';

import React, {useState, useEffect, useRef} from 'react';
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
    const [timeRangeFilter, setTimeRangeFilter] = useState('full');
    const [seasonFilter, setSeasonFilter] = useState('both');
    const [allMetricFilters, setAllMetricFilters] = useState({});
    const initialLoadRef = useRef(true);

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);

        // Initialize metric filters on first load only
        if (geojsonData.data && geojsonData.data.games && initialLoadRef.current) {
            // Dynamically extract all available Harvard financial metrics
            const extractMetricsFromData = () => {
                const metricsMap = new Map();

                geojsonData.data.games.forEach(game => {
                    if (game.harvard) {
                        Object.keys(game.harvard).forEach(key => {
                            if (game.harvard[key] && game.harvard[key].data) {
                                // Get format directly from Harvard data, fallback to pattern-based detection
                                const harvardMetric = game.harvard[key];
                                const actualFormat = harvardMetric.format;
                                const unit = harvardMetric.currency;

                                metricsMap.set(key, {format: actualFormat, unit: unit});
                            }
                        });
                    }
                });

                return Array.from(metricsMap.entries())
                    .map(([key, datum]) => {
                        // Generate human-readable name from key
                        let name = key.replace(/_/g, ' ');

                        // Remove any existing 2018/USD indicators first
                        name = name
                            .replace(/\s*\(usd\s*2018\)/gi, '')
                            .replace(/\s*\(usd_2018\)/gi, '')
                            .replace(/\s*\(2018\)/gi, '');

                        // Add standardized USD 2018 label
                        name = `${name} (USD 2018)`;

                        return {
                            key: key,
                            name: name,
                            format: datum.format,
                            unit: `${datum.unit} 2018`,
                        };
                    })
                    .filter(metric => metric.format === 'currency' && (metric.key.includes('2018') || metric.key.includes('usd2018')));
            };

            const metrics = extractMetricsFromData();
            const globalFilters = {};
            metrics.forEach(metric => {
                globalFilters[metric.name] = {
                    active: true,
                    visible: true,
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

        let processedData;

        if (seasonFilter === 'both') {
            // Create separate series for summer and winter for each metric
            processedData = filteredMetrics.flatMap(metric => {
                const seasons = ['summer', 'winter'];
                return seasons.map(season => {
                    const seasonData = data.games
                        .filter(game => {
                            const harvard = game.harvard;
                            const gameSeason = game.features && game.features.length > 0 ?
                                game.features[0].properties.season : null;

                            return harvard &&
                                harvard[metric.key] &&
                                harvard[metric.key].data &&
                                gameSeason &&
                                gameSeason.toLowerCase() === season.toLowerCase();
                        })
                        .map(game => {
                            const harvard = game.harvard;
                            const rawData = harvard[metric.key].data;

                            let value = parseFloat(rawData);

                            if (isNaN(value) || !isFinite(value)) {
                                return null;
                            }

                            if (metric.format === 'currency') {
                                value = value / 1000000;
                            }

                            const year = parseInt(game.year);
                            if (isNaN(year)) {
                                return null;
                            }

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
                        .filter(dataPoint => dataPoint !== null)
                        .sort((a, b) => a.x - b.x);

                    return {
                        id: `${metric.name} (${season.charAt(0).toUpperCase() + season.slice(1)})`,
                        data: seasonData,
                        baseName: metric.name,
                        season: season
                    };
                }).filter(series => series.data.length > 0);
            });
        } else {
            // Original logic for single season
            processedData = filteredMetrics.map(metric => ({
                id: metric.name,
                data: data.games
                    .filter(game => {
                        const harvard = game.harvard;
                        const gameSeason = game.features && game.features.length > 0 ?
                            game.features[0].properties.season : null;

                        return harvard &&
                            harvard[metric.key] &&
                            harvard[metric.key].data &&
                            gameSeason &&
                            gameSeason.toLowerCase() === seasonFilter.toLowerCase();
                    })
                    .map(game => {
                        const harvard = game.harvard;
                        const rawData = harvard[metric.key].data;

                        let value = parseFloat(rawData);

                        if (isNaN(value) || !isFinite(value)) {
                            return null;
                        }

                        if (metric.format === 'currency') {
                            value = value / 1000000;
                        }

                        const year = parseInt(game.year);
                        if (isNaN(year)) {
                            return null;
                        }

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
                    .filter(dataPoint => dataPoint !== null)
                    .sort((a, b) => a.x - b.x),
                baseName: metric.name,
                season: seasonFilter
            })).filter(series => series.data.length > 0);
        }

        setFinancialTimeData(processedData);
    }, [data, allMetricFilters, seasonFilter]);

    // Process aggregated financial data (costs, gains, profit)
    const [aggregatedTimeData, setAggregatedTimeData] = useState([]);

    useEffect(() => {
        if (!data || !data.games || Object.keys(allMetricFilters).length === 0) return;

        // Get active metrics
        const activeMetrics = Object.keys(allMetricFilters)
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

        const costMetrics = activeMetrics.filter(m => m.key.includes('cost'));
        const revenueMetrics = activeMetrics.filter(m => m.key.includes('revenue'));

        let processedAggregatedData;

        if (seasonFilter === 'both') {
            // Create separate series for summer and winter
            processedAggregatedData = ['summer', 'winter'].flatMap(season => {
                const gamesData = data.games
                    .filter(game => {
                        const harvard = game.harvard;
                        const gameSeason = game.features && game.features.length > 0 ?
                            game.features[0].properties.season : null;

                        return harvard && gameSeason &&
                            gameSeason.toLowerCase() === season.toLowerCase();
                    })
                    .map(game => {
                        const year = parseInt(game.year);
                        if (isNaN(year)) return null;

                        // Calculate total costs
                        let totalCost = 0;
                        costMetrics.forEach(metric => {
                            const harvard = game.harvard;
                            if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                                const value = parseFloat(harvard[metric.key].data);
                                if (!isNaN(value) && isFinite(value)) {
                                    totalCost += value / 1000000; // Convert to millions
                                }
                            }
                        });

                        // Calculate total revenue
                        let totalRevenue = 0;
                        revenueMetrics.forEach(metric => {
                            const harvard = game.harvard;
                            if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                                const value = parseFloat(harvard[metric.key].data);
                                if (!isNaN(value) && isFinite(value)) {
                                    totalRevenue += value / 1000000; // Convert to millions
                                }
                            }
                        });

                        const totalProfit = totalRevenue - totalCost;
                        const gameSeason = game.features && game.features.length > 0 ?
                            game.features[0].properties.season : 'Unknown';

                        return {
                            x: year,
                            location: game.location,
                            season: gameSeason,
                            totalCost,
                            totalRevenue,
                            totalProfit
                        };
                    })
                    .filter(dataPoint => dataPoint !== null)
                    .sort((a, b) => a.x - b.x);

                return [
                    {
                        id: `Total Costs (${season.charAt(0).toUpperCase() + season.slice(1)})`,
                        data: gamesData.map(d => ({x: d.x, y: d.totalCost, ...d})),
                        season: season,
                        type: 'cost'
                    },
                    {
                        id: `Total Revenue (${season.charAt(0).toUpperCase() + season.slice(1)})`,
                        data: gamesData.map(d => ({x: d.x, y: d.totalRevenue, ...d})),
                        season: season,
                        type: 'revenue'
                    },
                    {
                        id: `Total Profit (${season.charAt(0).toUpperCase() + season.slice(1)})`,
                        data: gamesData.map(d => ({x: d.x, y: d.totalProfit, ...d})),
                        season: season,
                        type: 'profit'
                    }
                ];
            }).filter(series => series.data.length > 0);
        } else {
            // Single season logic
            const gamesData = data.games
                .filter(game => {
                    const harvard = game.harvard;
                    const gameSeason = game.features && game.features.length > 0 ?
                        game.features[0].properties.season : null;

                    return harvard && gameSeason &&
                        gameSeason.toLowerCase() === seasonFilter.toLowerCase();
                })
                .map(game => {
                    const year = parseInt(game.year);
                    if (isNaN(year)) return null;

                    let totalCost = 0;
                    costMetrics.forEach(metric => {
                        const harvard = game.harvard;
                        if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                            const value = parseFloat(harvard[metric.key].data);
                            if (!isNaN(value) && isFinite(value)) {
                                totalCost += value / 1000000;
                            }
                        }
                    });

                    let totalRevenue = 0;
                    revenueMetrics.forEach(metric => {
                        const harvard = game.harvard;
                        if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                            const value = parseFloat(harvard[metric.key].data);
                            if (!isNaN(value) && isFinite(value)) {
                                totalRevenue += value / 1000000;
                            }
                        }
                    });

                    const totalProfit = totalRevenue - totalCost;
                    const gameSeason = game.features && game.features.length > 0 ?
                        game.features[0].properties.season : 'Unknown';

                    return {
                        x: year,
                        location: game.location,
                        season: gameSeason,
                        totalCost,
                        totalRevenue,
                        totalProfit
                    };
                })
                .filter(dataPoint => dataPoint !== null)
                .sort((a, b) => a.x - b.x);

            processedAggregatedData = [
                {
                    id: 'Total Costs',
                    data: gamesData.map(d => ({x: d.x, y: d.totalCost, ...d})),
                    season: seasonFilter,
                    type: 'cost'
                },
                {
                    id: 'Total Revenue',
                    data: gamesData.map(d => ({x: d.x, y: d.totalRevenue, ...d})),
                    season: seasonFilter,
                    type: 'revenue'
                },
                {
                    id: 'Total Profit',
                    data: gamesData.map(d => ({x: d.x, y: d.totalProfit, ...d})),
                    season: seasonFilter,
                    type: 'profit'
                }
            ].filter(series => series.data.length > 0);
        }

        setAggregatedTimeData(processedAggregatedData);
    }, [data, allMetricFilters, seasonFilter]);

    // Get the time range for financial data only
    const getFinancialDataTimeRange = () => {
        if (!financialTimeData || financialTimeData.length === 0) return {min: 'auto', max: 'auto'};

        const allYears = financialTimeData.flatMap(series => series.data.map(point => point.x));
        if (allYears.length === 0) return {min: 'auto', max: 'auto'};

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

    // Get line color for a metric based on its index in the visible metrics list
    const getMetricColor = (seriesId) => {
        if (!seriesId || typeof seriesId !== 'string') {
            return '#6b7280';  // Gray fallback color
        }

        const visibleMetrics = getVisibleMetrics();

        // Extract base metric name (remove season suffix if present)
        let baseName = seriesId;
        if (seriesId.includes(' (Summer)') || seriesId.includes(' (Winter)')) {
            baseName = seriesId.replace(' (Summer)', '').replace(' (Winter)', '');
        }

        const baseIndex = visibleMetrics.indexOf(baseName);
        const baseHue = baseIndex * 360 / visibleMetrics.length;

        // Same color for both summer and winter lines of the same metric
        return `hsl(${baseHue}, 70%, 50%)`;
    };

    // Get point color based on season
    const getPointColor = (seriesId) => {
        if (!seriesId || typeof seriesId !== 'string') {
            return '#6b7280';  // Gray fallback color
        }

        if (seasonFilter === 'both') {
            // When both seasons are shown, use different colors for each
            if (seriesId.includes(' (Summer)')) {
                return '#f59e0b';  // Amber-500 for summer
            } else if (seriesId.includes(' (Winter)')) {
                return '#06b6d4';  // Cyan-500 for winter
            }
        } else {
            // When single season is selected, use that season's color for all points
            if (seasonFilter === 'summer') {
                return '#f59e0b';  // Amber-500 for summer
            } else if (seasonFilter === 'winter') {
                return '#06b6d4';  // Cyan-500 for winter
            }
        }

        // Fallback to gray
        return '#6b7280';
    };

    // Get line color for aggregated chart based on type
    const getAggregatedLineColor = (seriesType) => {
        switch (seriesType) {
            case 'cost':
                return '#dc2626';     // Red
            case 'revenue':
                return '#16a34a';  // Green
            case 'profit':
                return '#2563eb';   // Blue
            default:
                return '#6b7280';         // Gray fallback
        }
    };

    // Get point color for aggregated chart based on season
    const getAggregatedPointColor = (series) => {
        if (!series) {
            return '#6b7280'; // Gray fallback for undefined series
        }

        if (seasonFilter === 'both') {
            // When both seasons are shown, use different colors for each
            if (series.season === 'summer') {
                return '#f59e0b';  // Amber-500 for summer
            } else if (series.season === 'winter') {
                return '#06b6d4';  // Cyan-500 for winter
            }
        } else {
            // When single season is selected, use that season's color for all points
            if (seasonFilter === 'summer') {
                return '#f59e0b';  // Amber-500 for summer
            } else if (seasonFilter === 'winter') {
                return '#06b6d4';  // Cyan-500 for winter
            }
        }

        // Fallback to gray
        return '#6b7280';
    };

    // Get point border color for aggregated chart
    const getAggregatedPointBorderColor = (series) => {
        if (!series) {
            return '#6b7280'; // Gray fallback for undefined series
        }

        if (seasonFilter === 'both') {
            if (series.season === 'summer') {
                return '#f59e0b';  // Amber border for summer
            } else if (series.season === 'winter') {
                return '#06b6d4';  // Cyan border for winter
            }
        } else {
            // Single season mode
            if (seasonFilter === 'summer') {
                return '#f59e0b';  // Amber border
            } else if (seasonFilter === 'winter') {
                return '#06b6d4';  // Cyan border
            }
        }
        return '#6b7280'; // Gray fallback
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
                            onClick={() => setSeasonFilter('both')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                seasonFilter === 'both'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Both
                        </button>
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

                {/* Individual Financial Metrics Chart Headline */}
                <div className="">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-1 text-center">
                        Individual Financial Metrics
                    </h4>
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
                        margin={{top: 50, right: 110, bottom: 50, left: 60}}
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
                        pointColor={(point) => getPointColor(point.point.seriesId)}
                        pointBorderWidth={2}
                        pointBorderColor="#ffffff"
                        enablePointLabel={false}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        tooltip={({point}) => (
                            <div
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80">
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
                <div className="flex flex-col items-center mt-4 gap-4">
                    {/* Metrics Legend (Line Colors) */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                            Financial Metrics
                        </span>
                        <div className="flex flex-wrap justify-center gap-4">
                            {/* Get unique base metrics */}
                            {Array.from(new Set(financialTimeData.map(series => {
                                // Extract base name without season suffix
                                let baseName = series.id;
                                if (series.id.includes(' (Summer)') || series.id.includes(' (Winter)')) {
                                    baseName = series.id.replace(' (Summer)', '').replace(' (Winter)', '');
                                }
                                return baseName;
                            }))).map((baseName) => (
                                <div key={baseName} className="flex items-center gap-2">
                                    <div
                                        className="w-4 h-0.5"
                                        style={{backgroundColor: getMetricColor(baseName)}}
                                    ></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        {baseName}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Season Legend (Point Colors) - Only show when "both" is selected */}
                    {seasonFilter === 'both' && (
                        <div className="flex flex-col items-center gap-2">
                            <span
                                className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                Olympic Seasons
                            </span>
                            <div className="flex flex-wrap justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{backgroundColor: '#f59e0b'}}
                                    ></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Summer
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{backgroundColor: '#06b6d4'}}
                                    ></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Winter
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Aggregated Financial Analysis Chart */}
                <div className="mt-12">
                    {/* Aggregated Financial Analysis Chart Headline */}
                    <div className="">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-1 text-center">
                            Total Financial Performance
                        </h4>
                    </div>

                    <div className="h-96 chart-container">
                        <style jsx>{`
                            .chart-container :global(text) {
                                fill: #d1d5db !important;
                                font-weight: 600 !important;
                            }
                        `}</style>
                        <ResponsiveLine
                            data={aggregatedTimeData}
                            margin={{top: 50, right: 110, bottom: 50, left: 80}}
                            xScale={{
                                type: 'linear',
                                min: timeRangeFilter === 'full' ? (data ? getYearRange(data).min : 'auto') : getFinancialDataTimeRange().min,
                                max: timeRangeFilter === 'full' ? (data ? getYearRange(data).max : 'auto') : getFinancialDataTimeRange().max
                            }}
                            colors={(serie) => getAggregatedLineColor(serie.type)}
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
                                legend: 'Value (M USD 2018)',
                                legendOffset: -60,
                                legendPosition: 'middle'
                            }}
                            pointSize={10}
                            pointColor={(point) => {
                                // Find the series data from aggregatedTimeData to get season info
                                if (!point.serie?.id && !point.point?.seriesId) {
                                    return '#6b7280'; // Gray fallback
                                }

                                const seriesId = point.serie?.id || point.point?.seriesId;
                                const seriesData = aggregatedTimeData.find(s => s.id === seriesId);
                                return getAggregatedPointColor(seriesData);
                            }}
                            pointBorderWidth={2}
                            pointBorderColor="#ffffff"
                            enablePointLabel={false}
                            pointLabelYOffset={-12}
                            useMesh={true}
                            tooltip={({point}) => (
                                <div
                                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80">
                                    <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                        {point.data.location} {point.data.x}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {point.data.season} Olympics
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                                            <span className="text-gray-900 dark:text-gray-100">{point.serieId}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Value:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-bold">
                                            {point.data.yFormatted} M USD 2018
                                        </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Total Costs: {point.data.totalCost?.toFixed(2)} M USD 2018<br/>
                                            Total Revenue: {point.data.totalRevenue?.toFixed(2)} M USD 2018<br/>
                                            Total Profit: {point.data.totalProfit?.toFixed(2)} M USD 2018
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

                    {/* Aggregated Chart Legend */}
                    <div className="flex flex-col items-center mt-4 gap-4">
                        {/* Financial Types Legend (Line Colors) */}
                        <div className="flex flex-col items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                            Financial Analysis
                        </span>
                            <div className="flex flex-wrap justify-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5" style={{backgroundColor: '#dc2626'}}></div>
                                    <span
                                        className="text-sm text-gray-700 dark:text-gray-300 font-medium">Total Costs</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5" style={{backgroundColor: '#16a34a'}}></div>
                                    <span
                                        className="text-sm text-gray-700 dark:text-gray-300 font-medium">Total Revenue</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-0.5" style={{backgroundColor: '#2563eb'}}></div>
                                    <span
                                        className="text-sm text-gray-700 dark:text-gray-300 font-medium">Total Profit</span>
                                </div>
                            </div>
                        </div>

                        {/* Season Legend (Point Colors) - Only show when "both" is selected */}
                        {seasonFilter === 'both' && (
                            <div className="flex flex-col items-center gap-2">
                            <span
                                className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                Olympic Seasons
                            </span>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{backgroundColor: '#f59e0b'}}
                                        ></div>
                                        <span
                                            className="text-sm text-gray-700 dark:text-gray-300 font-medium">Summer</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{backgroundColor: '#06b6d4'}}
                                        ></div>
                                        <span
                                            className="text-sm text-gray-700 dark:text-gray-300 font-medium">Winter</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CostAndProfitabilityAnalyses;