import {useEffect, useRef, useState} from "react";
import {ResponsiveLine} from '@nivo/line';
import {getColorFromPalet, getSeasonColor, getYearRange} from "@/app/graphs/components/utility";
import {olympicColors} from "@/components/utility";
import logger from '@/components/logger';

export default function FinancialMetrics({data}) {

    const [financialTimeData, setFinancialTimeData] = useState([]);
    const [timeRangeFilter, setTimeRangeFilter] = useState('full');
    const [seasonFilter, setSeasonFilter] = useState('both');
    const [dataMode, setDataMode] = useState('absolute');
    const [normalizationPer, setNormalizationPer] = useState('athlete');
    const [allMetricFilters, setAllMetricFilters] = useState({});
    const initialLoadRef = useRef(true);
    const [aggregatedTimeData, setAggregatedTimeData] = useState([]);

    // Helper function to get normalization divisor
    const getNormalizationDivisor = (game, normalizationPer) => {
        if (!game.harvard) return 1;

        switch (normalizationPer) {
            case 'athlete':
                return parseFloat(game.harvard.number_of_athletes?.data) || 1;
            case 'event':
                return parseFloat(game.harvard.number_of_events?.data) || 1;
            case 'country':
                return parseFloat(game.harvard.number_of_countries?.data) || 1;
            case 'media':
                return parseFloat(game.harvard.accredited_media?.data) || 1;
            default:
                return 1;
        }
    };

    // Initialize metric filters based on available data
    useEffect(() => {
        if (!data) return;

        // Initialize metric filters on first load only
        if (data.games && initialLoadRef.current) {
            // Dynamically extract all available Harvard financial metrics
            const extractMetricsFromData = () => {
                const metricsMap = new Map();

                data.games.forEach(game => {
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
    }, [data]);

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

                            // Store absolute value before normalization
                            const absoluteValue = value;

                            // Apply normalization if in normalized mode
                            if (dataMode === 'normalized') {
                                const divisor = getNormalizationDivisor(game, normalizationPer);
                                value = value / divisor;
                            }

                            const year = parseInt(game.year);
                            if (isNaN(year)) {
                                return null;
                            }

                            const gameSeason = game.features && game.features.length > 0 ?
                                game.features[0].properties.season : 'Unknown';

                            // Get counts for tooltip
                            const counts = {
                                athletes: parseFloat(game.harvard?.number_of_athletes?.data) || 0,
                                events: parseFloat(game.harvard?.number_of_events?.data) || 0,
                                countries: parseFloat(game.harvard?.number_of_countries?.data) || 0,
                                media: parseFloat(game.harvard?.accredited_media?.data) || 0
                            };

                            // Calculate normalized values for all metrics
                            const normalizedValues = {
                                perAthlete: counts.athletes > 0 ? absoluteValue / counts.athletes : 0,
                                perEvent: counts.events > 0 ? absoluteValue / counts.events : 0,
                                perCountry: counts.countries > 0 ? absoluteValue / counts.countries : 0,
                                perMedia: counts.media > 0 ? absoluteValue / counts.media : 0
                            };

                            return {
                                x: year,
                                y: value,
                                location: game.location,
                                season: gameSeason,
                                rawValue: rawData,
                                absoluteValue: absoluteValue,
                                unit: metric.unit,
                                metric: metric.name,
                                counts: counts,
                                normalizedValues: normalizedValues
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
        } else if (seasonFilter === 'combined') {
            // Create combined series that sum summer and winter data for each year
            processedData = filteredMetrics.map(metric => {
                // Get all games with this metric, grouped by year
                const yearDataMap = new Map();

                data.games
                    .filter(game => {
                        const harvard = game.harvard;
                        const gameSeason = game.features && game.features.length > 0 ?
                            game.features[0].properties.season : null;

                        return harvard &&
                            harvard[metric.key] &&
                            harvard[metric.key].data &&
                            gameSeason &&
                            (gameSeason.toLowerCase() === 'summer' || gameSeason.toLowerCase() === 'winter');
                    })
                    .forEach(game => {
                        const year = parseInt(game.year);
                        if (isNaN(year)) return;

                        const harvard = game.harvard;
                        const rawData = harvard[metric.key].data;
                        let value = parseFloat(rawData);

                        if (isNaN(value) || !isFinite(value)) return;

                        if (metric.format === 'currency') {
                            value = value / 1000000;
                        }

                        // Store absolute value before normalization
                        const absoluteValue = value;

                        // Apply normalization if in normalized mode
                        if (dataMode === 'normalized') {
                            const divisor = getNormalizationDivisor(game, normalizationPer);
                            value = value / divisor;
                        }

                        const gameSeason = game.features[0].properties.season;

                        // Get counts for tooltip
                        const counts = {
                            athletes: parseFloat(game.harvard?.number_of_athletes?.data) || 0,
                            events: parseFloat(game.harvard?.number_of_events?.data) || 0,
                            countries: parseFloat(game.harvard?.number_of_countries?.data) || 0,
                            media: parseFloat(game.harvard?.accredited_media?.data) || 0
                        };

                        if (!yearDataMap.has(year)) {
                            yearDataMap.set(year, {
                                year,
                                totalValue: 0,
                                totalAbsoluteValue: 0,
                                locations: [],
                                seasons: [],
                                allCounts: {
                                    athletes: 0,
                                    events: 0,
                                    countries: 0,
                                    media: 0
                                },
                                rawValues: []
                            });
                        }

                        const yearData = yearDataMap.get(year);
                        yearData.totalValue += value;
                        yearData.totalAbsoluteValue += absoluteValue;
                        yearData.locations.push(game.location);
                        yearData.seasons.push(gameSeason);
                        yearData.allCounts.athletes += counts.athletes;
                        yearData.allCounts.events += counts.events;
                        yearData.allCounts.countries += counts.countries;
                        yearData.allCounts.media += counts.media;
                        yearData.rawValues.push(rawData);
                    });

                // Convert the map to series data
                const seriesData = Array.from(yearDataMap.values()).map(yearData => {
                    // Calculate normalized values for all metrics
                    const normalizedValues = {
                        perAthlete: yearData.allCounts.athletes > 0 ? yearData.totalAbsoluteValue / yearData.allCounts.athletes : 0,
                        perEvent: yearData.allCounts.events > 0 ? yearData.totalAbsoluteValue / yearData.allCounts.events : 0,
                        perCountry: yearData.allCounts.countries > 0 ? yearData.totalAbsoluteValue / yearData.allCounts.countries : 0,
                        perMedia: yearData.allCounts.media > 0 ? yearData.totalAbsoluteValue / yearData.allCounts.media : 0
                    };

                    return {
                        x: yearData.year,
                        y: yearData.totalValue,
                        location: yearData.locations.join(' & '),
                        season: 'Summer & Winter',
                        rawValue: yearData.rawValues.join(' & '),
                        absoluteValue: yearData.totalAbsoluteValue,
                        unit: metric.unit,
                        metric: metric.name,
                        counts: yearData.allCounts,
                        normalizedValues: normalizedValues
                    };
                }).sort((a, b) => a.x - b.x);

                return {
                    id: metric.name,
                    data: seriesData,
                    baseName: metric.name,
                    season: 'combined'
                };
            }).filter(series => series.data.length > 0);
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

                        // Store absolute value before normalization
                        const absoluteValue = value;

                        // Apply normalization if in normalized mode
                        if (dataMode === 'normalized') {
                            const divisor = getNormalizationDivisor(game, normalizationPer);
                            value = value / divisor;
                        }

                        const year = parseInt(game.year);
                        if (isNaN(year)) {
                            return null;
                        }

                        const gameSeason = game.features && game.features.length > 0 ?
                            game.features[0].properties.season : 'Unknown';

                        // Get counts for tooltip
                        const counts = {
                            athletes: parseFloat(game.harvard?.number_of_athletes?.data) || 0,
                            events: parseFloat(game.harvard?.number_of_events?.data) || 0,
                            countries: parseFloat(game.harvard?.number_of_countries?.data) || 0,
                            media: parseFloat(game.harvard?.accredited_media?.data) || 0
                        };

                        // Calculate normalized values for all metrics
                        const normalizedValues = {
                            perAthlete: counts.athletes > 0 ? absoluteValue / counts.athletes : 0,
                            perEvent: counts.events > 0 ? absoluteValue / counts.events : 0,
                            perCountry: counts.countries > 0 ? absoluteValue / counts.countries : 0,
                            perMedia: counts.media > 0 ? absoluteValue / counts.media : 0
                        };

                        return {
                            x: year,
                            y: value,
                            location: game.location,
                            season: gameSeason,
                            rawValue: rawData,
                            absoluteValue: absoluteValue,
                            unit: metric.unit,
                            metric: metric.name,
                            counts: counts,
                            normalizedValues: normalizedValues
                        };
                    })
                    .filter(dataPoint => dataPoint !== null)
                    .sort((a, b) => a.x - b.x),
                baseName: metric.name,
                season: seasonFilter
            })).filter(series => series.data.length > 0);
        }

        setFinancialTimeData(processedData);
    }, [data, allMetricFilters, seasonFilter, dataMode, normalizationPer]);

    // Process aggregated financial data (costs, gains, profit)
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
                        const divisor = dataMode === 'normalized' ? getNormalizationDivisor(game, normalizationPer) : 1;

                        costMetrics.forEach(metric => {
                            const harvard = game.harvard;
                            if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                                let value = parseFloat(harvard[metric.key].data);
                                if (!isNaN(value) && isFinite(value)) {
                                    value = value / 1000000; // Convert to millions
                                    value = value / divisor; // Apply normalization
                                    totalCost += value;
                                }
                            }
                        });

                        // Calculate total revenue
                        let totalRevenue = 0;
                        revenueMetrics.forEach(metric => {
                            const harvard = game.harvard;
                            if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                                let value = parseFloat(harvard[metric.key].data);
                                if (!isNaN(value) && isFinite(value)) {
                                    value = value / 1000000; // Convert to millions
                                    value = value / divisor; // Apply normalization
                                    totalRevenue += value;
                                }
                            }
                        });

                        const totalProfit = totalRevenue - totalCost;
                        const gameSeason = game.features && game.features.length > 0 ?
                            game.features[0].properties.season : 'Unknown';

                        // Get counts for tooltip
                        const counts = {
                            athletes: parseFloat(game.harvard?.number_of_athletes?.data) || 0,
                            events: parseFloat(game.harvard?.number_of_events?.data) || 0,
                            countries: parseFloat(game.harvard?.number_of_countries?.data) || 0,
                            media: parseFloat(game.harvard?.accredited_media?.data) || 0
                        };

                        // Calculate absolute values (before any normalization)
                        const absoluteTotalCost = dataMode === 'normalized' ? totalCost * divisor : totalCost;
                        const absoluteTotalRevenue = dataMode === 'normalized' ? totalRevenue * divisor : totalRevenue;
                        const absoluteTotalProfit = absoluteTotalRevenue - absoluteTotalCost;

                        // Calculate normalized values for all metrics
                        const normalizedValues = {
                            cost: {
                                perAthlete: counts.athletes > 0 ? absoluteTotalCost / counts.athletes : 0,
                                perEvent: counts.events > 0 ? absoluteTotalCost / counts.events : 0,
                                perCountry: counts.countries > 0 ? absoluteTotalCost / counts.countries : 0,
                                perMedia: counts.media > 0 ? absoluteTotalCost / counts.media : 0
                            },
                            revenue: {
                                perAthlete: counts.athletes > 0 ? absoluteTotalRevenue / counts.athletes : 0,
                                perEvent: counts.events > 0 ? absoluteTotalRevenue / counts.events : 0,
                                perCountry: counts.countries > 0 ? absoluteTotalRevenue / counts.countries : 0,
                                perMedia: counts.media > 0 ? absoluteTotalRevenue / counts.media : 0
                            },
                            profit: {
                                perAthlete: counts.athletes > 0 ? absoluteTotalProfit / counts.athletes : 0,
                                perEvent: counts.events > 0 ? absoluteTotalProfit / counts.events : 0,
                                perCountry: counts.countries > 0 ? absoluteTotalProfit / counts.countries : 0,
                                perMedia: counts.media > 0 ? absoluteTotalProfit / counts.media : 0
                            }
                        };

                        return {
                            x: year,
                            location: game.location,
                            season: gameSeason,
                            totalCost,
                            totalRevenue,
                            totalProfit,
                            absoluteTotalCost,
                            absoluteTotalRevenue,
                            absoluteTotalProfit,
                            counts,
                            normalizedValues
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
        } else if (seasonFilter === 'combined') {
            // Create combined aggregated data that sums summer and winter for each year
            const yearDataMap = new Map();

            data.games
                .filter(game => {
                    const harvard = game.harvard;
                    const gameSeason = game.features && game.features.length > 0 ?
                        game.features[0].properties.season : null;

                    return harvard && gameSeason &&
                        (gameSeason.toLowerCase() === 'summer' || gameSeason.toLowerCase() === 'winter');
                })
                .forEach(game => {
                    const year = parseInt(game.year);
                    if (isNaN(year)) return;

                    const divisor = dataMode === 'normalized' ? getNormalizationDivisor(game, normalizationPer) : 1;

                    // Calculate total costs for this game
                    let gameTotalCost = 0;
                    costMetrics.forEach(metric => {
                        const harvard = game.harvard;
                        if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                            let value = parseFloat(harvard[metric.key].data);
                            if (!isNaN(value) && isFinite(value)) {
                                value = value / 1000000; // Convert to millions
                                value = value / divisor; // Apply normalization
                                gameTotalCost += value;
                            }
                        }
                    });

                    // Calculate total revenue for this game
                    let gameTotalRevenue = 0;
                    revenueMetrics.forEach(metric => {
                        const harvard = game.harvard;
                        if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                            let value = parseFloat(harvard[metric.key].data);
                            if (!isNaN(value) && isFinite(value)) {
                                value = value / 1000000; // Convert to millions
                                value = value / divisor; // Apply normalization
                                gameTotalRevenue += value;
                            }
                        }
                    });

                    const gameTotalProfit = gameTotalRevenue - gameTotalCost;
                    const gameSeason = game.features[0].properties.season;

                    // Get counts for tooltip
                    const counts = {
                        athletes: parseFloat(game.harvard?.number_of_athletes?.data) || 0,
                        events: parseFloat(game.harvard?.number_of_events?.data) || 0,
                        countries: parseFloat(game.harvard?.number_of_countries?.data) || 0,
                        media: parseFloat(game.harvard?.accredited_media?.data) || 0
                    };

                    if (!yearDataMap.has(year)) {
                        yearDataMap.set(year, {
                            year,
                            totalCost: 0,
                            totalRevenue: 0,
                            totalProfit: 0,
                            locations: [],
                            seasons: [],
                            allCounts: {
                                athletes: 0,
                                events: 0,
                                countries: 0,
                                media: 0
                            }
                        });
                    }

                    const yearData = yearDataMap.get(year);
                    yearData.totalCost += gameTotalCost;
                    yearData.totalRevenue += gameTotalRevenue;
                    yearData.totalProfit += gameTotalProfit;
                    yearData.locations.push(game.location);
                    yearData.seasons.push(gameSeason);
                    yearData.allCounts.athletes += counts.athletes;
                    yearData.allCounts.events += counts.events;
                    yearData.allCounts.countries += counts.countries;
                    yearData.allCounts.media += counts.media;
                });

            // Convert the map to series data
            const combinedGamesData = Array.from(yearDataMap.values()).map(yearData => {
                // Calculate absolute values (before any normalization)
                const absoluteTotalCost = dataMode === 'normalized' ? yearData.totalCost * getNormalizationDivisor({harvard: {number_of_athletes: {data: yearData.allCounts.athletes}}}, normalizationPer) : yearData.totalCost;
                const absoluteTotalRevenue = dataMode === 'normalized' ? yearData.totalRevenue * getNormalizationDivisor({harvard: {number_of_athletes: {data: yearData.allCounts.athletes}}}, normalizationPer) : yearData.totalRevenue;
                const absoluteTotalProfit = absoluteTotalRevenue - absoluteTotalCost;

                // Calculate normalized values for all metrics
                const normalizedValues = {
                    cost: {
                        perAthlete: yearData.allCounts.athletes > 0 ? absoluteTotalCost / yearData.allCounts.athletes : 0,
                        perEvent: yearData.allCounts.events > 0 ? absoluteTotalCost / yearData.allCounts.events : 0,
                        perCountry: yearData.allCounts.countries > 0 ? absoluteTotalCost / yearData.allCounts.countries : 0,
                        perMedia: yearData.allCounts.media > 0 ? absoluteTotalCost / yearData.allCounts.media : 0
                    },
                    revenue: {
                        perAthlete: yearData.allCounts.athletes > 0 ? absoluteTotalRevenue / yearData.allCounts.athletes : 0,
                        perEvent: yearData.allCounts.events > 0 ? absoluteTotalRevenue / yearData.allCounts.events : 0,
                        perCountry: yearData.allCounts.countries > 0 ? absoluteTotalRevenue / yearData.allCounts.countries : 0,
                        perMedia: yearData.allCounts.media > 0 ? absoluteTotalRevenue / yearData.allCounts.media : 0
                    },
                    profit: {
                        perAthlete: yearData.allCounts.athletes > 0 ? absoluteTotalProfit / yearData.allCounts.athletes : 0,
                        perEvent: yearData.allCounts.events > 0 ? absoluteTotalProfit / yearData.allCounts.events : 0,
                        perCountry: yearData.allCounts.countries > 0 ? absoluteTotalProfit / yearData.allCounts.countries : 0,
                        perMedia: yearData.allCounts.media > 0 ? absoluteTotalProfit / yearData.allCounts.media : 0
                    }
                };

                return {
                    x: yearData.year,
                    location: yearData.locations.join(' & '),
                    season: 'Summer & Winter',
                    totalCost: yearData.totalCost,
                    totalRevenue: yearData.totalRevenue,
                    totalProfit: yearData.totalProfit,
                    absoluteTotalCost,
                    absoluteTotalRevenue,
                    absoluteTotalProfit,
                    counts: yearData.allCounts,
                    normalizedValues
                };
            }).sort((a, b) => a.x - b.x);

            processedAggregatedData = [
                {
                    id: 'Total Costs',
                    data: combinedGamesData.map(d => ({x: d.x, y: d.totalCost, ...d})),
                    season: 'combined',
                    type: 'cost'
                },
                {
                    id: 'Total Revenue',
                    data: combinedGamesData.map(d => ({x: d.x, y: d.totalRevenue, ...d})),
                    season: 'combined',
                    type: 'revenue'
                },
                {
                    id: 'Total Profit',
                    data: combinedGamesData.map(d => ({x: d.x, y: d.totalProfit, ...d})),
                    season: 'combined',
                    type: 'profit'
                }
            ].filter(series => series.data.length > 0);
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
                    const divisor = dataMode === 'normalized' ? getNormalizationDivisor(game, normalizationPer) : 1;

                    costMetrics.forEach(metric => {
                        const harvard = game.harvard;
                        if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                            let value = parseFloat(harvard[metric.key].data);
                            if (!isNaN(value) && isFinite(value)) {
                                value = value / 1000000; // Convert to millions
                                value = value / divisor; // Apply normalization
                                totalCost += value;
                            }
                        }
                    });

                    let totalRevenue = 0;
                    revenueMetrics.forEach(metric => {
                        const harvard = game.harvard;
                        if (harvard && harvard[metric.key] && harvard[metric.key].data) {
                            let value = parseFloat(harvard[metric.key].data);
                            if (!isNaN(value) && isFinite(value)) {
                                value = value / 1000000; // Convert to millions
                                value = value / divisor; // Apply normalization
                                totalRevenue += value;
                            }
                        }
                    });

                    const totalProfit = totalRevenue - totalCost;
                    const gameSeason = game.features && game.features.length > 0 ?
                        game.features[0].properties.season : 'Unknown';

                    // Get counts for tooltip
                    const counts = {
                        athletes: parseFloat(game.harvard?.number_of_athletes?.data) || 0,
                        events: parseFloat(game.harvard?.number_of_events?.data) || 0,
                        countries: parseFloat(game.harvard?.number_of_countries?.data) || 0,
                        media: parseFloat(game.harvard?.accredited_media?.data) || 0
                    };

                    // Calculate absolute values (before any normalization)
                    const absoluteTotalCost = dataMode === 'normalized' ? totalCost * divisor : totalCost;
                    const absoluteTotalRevenue = dataMode === 'normalized' ? totalRevenue * divisor : totalRevenue;
                    const absoluteTotalProfit = absoluteTotalRevenue - absoluteTotalCost;

                    // Calculate normalized values for all metrics
                    const normalizedValues = {
                        cost: {
                            perAthlete: counts.athletes > 0 ? absoluteTotalCost / counts.athletes : 0,
                            perEvent: counts.events > 0 ? absoluteTotalCost / counts.events : 0,
                            perCountry: counts.countries > 0 ? absoluteTotalCost / counts.countries : 0,
                            perMedia: counts.media > 0 ? absoluteTotalCost / counts.media : 0
                        },
                        revenue: {
                            perAthlete: counts.athletes > 0 ? absoluteTotalRevenue / counts.athletes : 0,
                            perEvent: counts.events > 0 ? absoluteTotalRevenue / counts.events : 0,
                            perCountry: counts.countries > 0 ? absoluteTotalRevenue / counts.countries : 0,
                            perMedia: counts.media > 0 ? absoluteTotalRevenue / counts.media : 0
                        },
                        profit: {
                            perAthlete: counts.athletes > 0 ? absoluteTotalProfit / counts.athletes : 0,
                            perEvent: counts.events > 0 ? absoluteTotalProfit / counts.events : 0,
                            perCountry: counts.countries > 0 ? absoluteTotalProfit / counts.countries : 0,
                            perMedia: counts.media > 0 ? absoluteTotalProfit / counts.media : 0
                        }
                    };

                    return {
                        x: year,
                        location: game.location,
                        season: gameSeason,
                        totalCost,
                        totalRevenue,
                        totalProfit,
                        absoluteTotalCost,
                        absoluteTotalRevenue,
                        absoluteTotalProfit,
                        counts,
                        normalizedValues
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
    }, [data, allMetricFilters, seasonFilter, dataMode, normalizationPer]);

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


    // Get line color for aggregated chart based on type
    const getAggregatedLineColor = (seriesType) => {
        switch (seriesType) {
            case 'cost':
                return olympicColors.primary.red;     // Red
            case 'revenue':
                return olympicColors.primary.green;  // Green
            case 'profit':
                return olympicColors.primary.blue;   // Blue
            default:
                return olympicColors.extended.black2;         // Gray fallback
        }
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

    return (
        <div
            className="mx-4 mb-8 bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                    📈 Financial Metrics Over Time
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Line Chart
                    </span>
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
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

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Data View:</span>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setDataMode('absolute')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    dataMode === 'absolute'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Absolute
                            </button>
                            <button
                                onClick={() => setDataMode('normalized')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    dataMode === 'normalized'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Normalized
                            </button>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 transition-opacity ${
                        dataMode === 'normalized' ? 'opacity-100' : 'opacity-40 pointer-events-none'
                    }`}>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Normalize Per:</span>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => dataMode === 'normalized' && setNormalizationPer('athlete')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    normalizationPer === 'athlete' && dataMode === 'normalized'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                                disabled={dataMode !== 'normalized'}
                            >
                                Athlete
                            </button>
                            <button
                                onClick={() => dataMode === 'normalized' && setNormalizationPer('event')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    normalizationPer === 'event' && dataMode === 'normalized'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                                disabled={dataMode !== 'normalized'}
                            >
                                Event
                            </button>
                            <button
                                onClick={() => dataMode === 'normalized' && setNormalizationPer('country')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    normalizationPer === 'country' && dataMode === 'normalized'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                                disabled={dataMode !== 'normalized'}
                            >
                                Country
                            </button>
                            <button
                                onClick={() => dataMode === 'normalized' && setNormalizationPer('media')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    normalizationPer === 'media' && dataMode === 'normalized'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                                disabled={dataMode !== 'normalized'}
                            >
                                Media
                            </button>
                        </div>
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
                    <button
                        onClick={() => setSeasonFilter('combined')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            seasonFilter === 'combined'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        Combined
                    </button>
                </div>
            </div>


            {/* Financial Metrics Selection Filter */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Financial Metrics
                </label>
                <div className="flex flex-wrap gap-2">
                    {getVisibleMetrics().map((metricName, index) => {
                        const filterState = allMetricFilters[metricName];
                        const visibleMetrics = getVisibleMetrics();
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
                                        ? getColorFromPalet(index, visibleMetrics.length, 0.6)
                                        : undefined
                                }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{backgroundColor: getColorFromPalet(index, visibleMetrics.length)}}
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
                    margin={{top: 20, right: 30, bottom: 50, left: 60}}
                    xScale={{
                        type: 'linear',
                        min: timeRangeFilter === 'full' ? (data ? getYearRange(data).min : 'auto') : getFinancialDataTimeRange().min,
                        max: timeRangeFilter === 'full' ? (data ? getYearRange(data).max : 'auto') : getFinancialDataTimeRange().max
                    }}
                    colors={(serie) => {
                        const visibleMetrics = getVisibleMetrics();
                        let baseName = serie.id;
                        if (serie.id.includes(' (Summer)') || serie.id.includes(' (Winter)')) {
                            baseName = serie.id.replace(' (Summer)', '').replace(' (Winter)', '');
                        }
                        const baseIndex = visibleMetrics.indexOf(baseName);
                        return getColorFromPalet(baseIndex, visibleMetrics.length);
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
                        legend: dataMode === 'normalized' ? `Value per ${normalizationPer.charAt(0).toUpperCase() + normalizationPer.slice(1)} (M USD 2018)` : 'Value (M USD 2018)',
                        legendOffset: -50,
                        legendPosition: 'middle'
                    }}
                    pointSize={10}
                    pointColor={(point) => {
                        if (seasonFilter === 'both') {
                            // Extract season from series ID when both seasons are shown
                            const seriesId = point.point?.seriesId || point.serie?.id || point.serieId || '';
                            if (seriesId.includes(' (Summer)')) {
                                return getSeasonColor('Summer');
                            } else if (seriesId.includes(' (Winter)')) {
                                return getSeasonColor('Winter');
                            }
                        } else if (seasonFilter === 'combined') {
                            // Use a specific color for combined data points
                            return '#10b981'; // emerald color
                        } else {
                            // Use the selected season filter
                            const season = seasonFilter === 'summer' ? 'Summer' : 'Winter';
                            return getSeasonColor(season);
                        }
                        return getSeasonColor('Unknown');
                    }}
                    pointBorderWidth={1}
                    pointBorderColor={olympicColors.extended.black6}
                    enablePointLabel={false}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    tooltip={({point}) => (
                        <div
                            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-96 max-w-md">
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
                                    <span
                                        className="font-medium text-gray-700 dark:text-gray-300">Absolute Value:</span>
                                    <span className="text-gray-900 dark:text-gray-100 font-bold">
                                        {point.data.absoluteValue.toFixed(2)} M USD 2018
                                    </span>
                                </div>

                                {/* Counts Section */}
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                                    <div
                                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                        Olympic Counts
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Athletes:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.counts.athletes.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Events:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.counts.events.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Countries:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.counts.countries.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Media:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.counts.media.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Normalized Values Section */}
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                                    <div
                                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                        Normalized Values (M USD 2018)
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Per Athlete:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.normalizedValues.perAthlete.toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Per Event:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.normalizedValues.perEvent.toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Per Country:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.normalizedValues.perCountry.toFixed(4)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Per Media:</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                {point.data.normalizedValues.perMedia.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                                    style={{
                                        backgroundColor: getColorFromPalet(Array.from(new Set(financialTimeData.map(series => {
                                            let baseName = series.id;
                                            if (series.id.includes(' (Summer)') || series.id.includes(' (Winter)')) {
                                                baseName = series.id.replace(' (Summer)', '').replace(' (Winter)', '');
                                            }
                                            return baseName;
                                        }))).indexOf(baseName), Array.from(new Set(financialTimeData.map(series => {
                                            let baseName = series.id;
                                            if (series.id.includes(' (Summer)') || series.id.includes(' (Winter)')) {
                                                baseName = series.id.replace(' (Summer)', '').replace(' (Winter)', '');
                                            }
                                            return baseName;
                                        }))).length)
                                    }}
                                ></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {baseName}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Season Legend (Point Colors) - Show when "both" or "combined" is selected */}
                {(seasonFilter === 'both' || seasonFilter === 'combined') && (
                    <div className="flex flex-col items-center gap-2">
                        <span
                            className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                            Olympic Seasons
                        </span>
                        <div className="flex flex-wrap justify-center gap-4">
                            {seasonFilter === 'both' ? (
                                <>
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
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{backgroundColor: '#10b981'}}
                                    ></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Summer & Winter Combined
                                    </span>
                                </div>
                            )}
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
                        margin={{top: 20, right: 30, bottom: 50, left: 60}}
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
                            legend: dataMode === 'normalized' ? `Value per ${normalizationPer.charAt(0).toUpperCase() + normalizationPer.slice(1)} (M USD 2018)` : 'Value (M USD 2018)',
                            legendOffset: -50,
                            legendPosition: 'middle'
                        }}
                        pointSize={10}
                        pointColor={(point) => {
                            if (seasonFilter === 'both') {
                                // Extract season from series ID when both seasons are shown
                                const seriesId = point.point?.seriesId || point.serie?.id || point.serieId || '';
                                if (seriesId.includes(' (Summer)')) {
                                    return getSeasonColor('Summer');
                                } else if (seriesId.includes(' (Winter)')) {
                                    return getSeasonColor('Winter');
                                }
                            } else if (seasonFilter === 'combined') {
                                // Use a specific color for combined data points
                                return '#10b981'; // emerald color
                            } else {
                                // Use the selected season filter
                                const season = seasonFilter === 'summer' ? 'Summer' : 'Winter';
                                return getSeasonColor(season);
                            }
                            return getSeasonColor('Unknown');
                        }}
                        pointBorderWidth={1}
                        pointBorderColor={olympicColors.extended.black6}
                        enablePointLabel={false}
                        pointLabelYOffset={-12}
                        useMesh={true}
                        tooltip={({point}) => {
                            // Determine which metric we're showing
                            const serieId = point.serieId || point.serie?.id || point.id || '';
                            logger.debug('Tooltip debug:', {point, serieId, serieObject: point.serie});

                            const metricType = serieId.toLowerCase().includes('cost') ? 'cost' :
                                serieId.toLowerCase().includes('revenue') ? 'revenue' : 'profit';

                            // Clean up the display name - extract base metric type
                            let displayType = '';
                            if (serieId.toLowerCase().includes('cost')) {
                                displayType = 'Total Costs';
                            } else if (serieId.toLowerCase().includes('revenue')) {
                                displayType = 'Total Revenue';
                            } else if (serieId.toLowerCase().includes('profit')) {
                                displayType = 'Total Profit';
                            } else {
                                displayType = serieId || 'Unknown'; // fallback to original or Unknown
                            }

                            return (
                                <div
                                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-96 max-w-md">
                                    <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                        {point.data.location} {point.data.x}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {point.data.season} Olympics
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                                            <span className="text-gray-900 dark:text-gray-100">{displayType}</span>
                                        </div>

                                        {/* Absolute Values Section */}
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                                            <div
                                                className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                Absolute Values (M USD 2018)
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-gray-600 dark:text-gray-400">Total Costs:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.absoluteTotalCost?.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-gray-600 dark:text-gray-400">Total
                                                        Revenue:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.absoluteTotalRevenue?.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-gray-600 dark:text-gray-400">Total
                                                        Profit:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-bold">
                                                        {point.data.absoluteTotalProfit?.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Counts Section */}
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                                            <div
                                                className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                Olympic Counts
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Athletes:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.counts.athletes.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Events:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.counts.events.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Countries:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.counts.countries.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Media:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.counts.media.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Normalized Values for Current Metric */}
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-3">
                                            <div
                                                className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                                {displayType} - Normalized Values (M USD 2018)
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-gray-600 dark:text-gray-400">Per Athlete:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.normalizedValues[metricType].perAthlete.toFixed(4)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Per Event:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.normalizedValues[metricType].perEvent.toFixed(4)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-gray-600 dark:text-gray-400">Per Country:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.normalizedValues[metricType].perCountry.toFixed(4)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Per Media:</span>
                                                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                                                        {point.data.normalizedValues[metricType].perMedia.toFixed(4)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }}
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
                                    className="text-sm text-gray-700 dark:text-gray-300 font-medium">Total
                                    Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-0.5" style={{backgroundColor: '#2563eb'}}></div>
                                <span
                                    className="text-sm text-gray-700 dark:text-gray-300 font-medium">Total Profit</span>
                            </div>
                        </div>
                    </div>

                    {/* Season Legend (Point Colors) - Show when "both" or "combined" is selected */}
                    {(seasonFilter === 'both' || seasonFilter === 'combined') && (
                        <div className="flex flex-col items-center gap-2">
                            <span
                                className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                Olympic Seasons
                            </span>
                            <div className="flex flex-wrap justify-center gap-4">
                                {seasonFilter === 'both' ? (
                                    <>
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
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{backgroundColor: '#10b981'}}
                                        ></div>
                                        <span
                                            className="text-sm text-gray-700 dark:text-gray-300 font-medium">Summer &
                                            Winter Combined</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
