'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveRadar } from '@nivo/radar';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import logger from '@/components/logger';

const SummerWinterRadarChart = ({ geojsonData }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayMode, setDisplayMode] = useState('percentage'); // 'percentage' or 'absolute'

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);
    }, [geojsonData]);

    // Helper to get value from harvard array
    const getFieldValue = (harvardObj, fieldName) => {
        if (!harvardObj || !harvardObj[fieldName] || harvardObj[fieldName].data === undefined || harvardObj[fieldName].data === null) return 0;
        const value = parseFloat(harvardObj[fieldName].data);
        return isNaN(value) ? 0 : value;
    };

    // Process data for Summer vs Winter efficiency comparison
    const getRadarData = () => {
        if (!data?.games) return [];

        // Filter games that have Harvard data
        const validGames = data.games.filter(g => g.harvard && Object.keys(g.harvard).length > 0);

        const summerGames = validGames.filter(game => {
            const season = game.season || (game.features && game.features[0]?.properties?.season) || '';
            return season.toLowerCase() === 'summer';
        });

        const winterGames = validGames.filter(game => {
            const season = game.season || (game.features && game.features[0]?.properties?.season) || '';
            return season.toLowerCase() === 'winter';
        });

        console.log('Summer games:', summerGames.length, 'Winter games:', winterGames.length);

        // Calculate efficiency metrics for each game type
        const calculateEfficiencyMetrics = (games) => {
            if (games.length === 0) return {
                costPerAthlete: 0,
                revenuePerAthlete: 0,
                athletesPerSport: 0,
                mediaPerAthlete: 0,
                costPerVenue: 0,
                revenuePerEvent: 0
            };

            const efficiencyTotals = games.reduce((acc, game) => {
                // Get basic metrics from Harvard data
                const athletes = getFieldValue(game.harvard, 'number_of_athletes');
                const events = getFieldValue(game.harvard, 'number_of_events');
                const media = getFieldValue(game.harvard, 'accredited_media');

                // Cost metrics
                const venueCosts = getFieldValue(game.harvard, 'cost_of_venues_(usd_2018)');
                const orgCosts = getFieldValue(game.harvard, 'cost_of_organisation_(usd_2018)');
                const totalCosts = venueCosts + orgCosts;

                // Revenue metrics
                const ticketRevenue = getFieldValue(game.harvard, 'ticketing_revenue_(usd2018)');
                const broadcastRevenue = getFieldValue(game.harvard, 'broadcast_revenue_(usd2018)');
                const intlSponsorRevenue = getFieldValue(game.harvard, 'international_sponsorship_revenue_(usd_2018)');
                const domSponsorRevenue = getFieldValue(game.harvard, 'domestic_sponsorship_revenue_(usd_2018)');
                const totalRevenue = ticketRevenue + broadcastRevenue + intlSponsorRevenue + domSponsorRevenue;

                // Venue and sports data
                const venueCount = game.venueCount || game.features?.length || 0;
                const uniqueSports = new Set();
                game.features?.forEach(feature => {
                    if (feature.properties.sports && Array.isArray(feature.properties.sports)) {
                        feature.properties.sports.forEach(sport => uniqueSports.add(sport));
                    }
                });
                const sportsCount = uniqueSports.size;

                // Calculate efficiency metrics (avoid division by zero)
                const costPerAthlete = athletes > 0 ? totalCosts / athletes : 0;
                const revenuePerAthlete = athletes > 0 ? totalRevenue / athletes : 0;
                const athletesPerSport = sportsCount > 0 ? athletes / sportsCount : 0;
                const mediaPerAthlete = athletes > 0 ? media / athletes : 0;
                const costPerVenue = venueCount > 0 ? totalCosts / venueCount : 0;
                const revenuePerEvent = events > 0 ? totalRevenue / events : 0;

                return {
                    costPerAthlete: acc.costPerAthlete + costPerAthlete,
                    revenuePerAthlete: acc.revenuePerAthlete + revenuePerAthlete,
                    athletesPerSport: acc.athletesPerSport + athletesPerSport,
                    mediaPerAthlete: acc.mediaPerAthlete + mediaPerAthlete,
                    costPerVenue: acc.costPerVenue + costPerVenue,
                    revenuePerEvent: acc.revenuePerEvent + revenuePerEvent
                };
            }, {
                costPerAthlete: 0,
                revenuePerAthlete: 0,
                athletesPerSport: 0,
                mediaPerAthlete: 0,
                costPerVenue: 0,
                revenuePerEvent: 0
            });

            // Return averages
            return {
                costPerAthlete: efficiencyTotals.costPerAthlete / games.length,
                revenuePerAthlete: efficiencyTotals.revenuePerAthlete / games.length,
                athletesPerSport: efficiencyTotals.athletesPerSport / games.length,
                mediaPerAthlete: efficiencyTotals.mediaPerAthlete / games.length,
                costPerVenue: efficiencyTotals.costPerVenue / games.length,
                revenuePerEvent: efficiencyTotals.revenuePerEvent / games.length
            };
        };

        const summerEfficiency = calculateEfficiencyMetrics(summerGames);
        const winterEfficiency = calculateEfficiencyMetrics(winterGames);

        console.log('Summer efficiency:', summerEfficiency);
        console.log('Winter efficiency:', winterEfficiency);

        if (displayMode === 'absolute') {
            // Return absolute values (scaled down for better visualization)
            return [
                {
                    metric: 'Cost per Athlete ($K)',
                    Summer: Math.round(summerEfficiency.costPerAthlete / 1000),
                    Winter: Math.round(winterEfficiency.costPerAthlete / 1000)
                },
                {
                    metric: 'Revenue per Athlete ($K)',
                    Summer: Math.round(summerEfficiency.revenuePerAthlete / 1000),
                    Winter: Math.round(winterEfficiency.revenuePerAthlete / 1000)
                },
                {
                    metric: 'Athletes per Sport',
                    Summer: Math.round(summerEfficiency.athletesPerSport),
                    Winter: Math.round(winterEfficiency.athletesPerSport)
                },
                {
                    metric: 'Media per Athlete',
                    Summer: Math.round(summerEfficiency.mediaPerAthlete * 10) / 10,
                    Winter: Math.round(winterEfficiency.mediaPerAthlete * 10) / 10
                },
                {
                    metric: 'Cost per Venue ($M)',
                    Summer: Math.round(summerEfficiency.costPerVenue / 1000000),
                    Winter: Math.round(winterEfficiency.costPerVenue / 1000000)
                },
                {
                    metric: 'Revenue per Event ($M)',
                    Summer: Math.round(summerEfficiency.revenuePerEvent / 1000000),
                    Winter: Math.round(winterEfficiency.revenuePerEvent / 1000000)
                }
            ];
        } else {
            // Normalize data to 0-100 scale for percentage view
            const maxValues = {
                costPerAthlete: Math.max(summerEfficiency.costPerAthlete, winterEfficiency.costPerAthlete),
                revenuePerAthlete: Math.max(summerEfficiency.revenuePerAthlete, winterEfficiency.revenuePerAthlete),
                athletesPerSport: Math.max(summerEfficiency.athletesPerSport, winterEfficiency.athletesPerSport),
                mediaPerAthlete: Math.max(summerEfficiency.mediaPerAthlete, winterEfficiency.mediaPerAthlete),
                costPerVenue: Math.max(summerEfficiency.costPerVenue, winterEfficiency.costPerVenue),
                revenuePerEvent: Math.max(summerEfficiency.revenuePerEvent, winterEfficiency.revenuePerEvent)
            };

            const normalize = (value, max) => max > 0 ? (value / max) * 100 : 0;

            return [
                {
                    metric: 'Cost per Athlete (%)',
                    Summer: normalize(summerEfficiency.costPerAthlete, maxValues.costPerAthlete),
                    Winter: normalize(winterEfficiency.costPerAthlete, maxValues.costPerAthlete)
                },
                {
                    metric: 'Revenue per Athlete (%)',
                    Summer: normalize(summerEfficiency.revenuePerAthlete, maxValues.revenuePerAthlete),
                    Winter: normalize(winterEfficiency.revenuePerAthlete, maxValues.revenuePerAthlete)
                },
                {
                    metric: 'Athletes per Sport (%)',
                    Summer: normalize(summerEfficiency.athletesPerSport, maxValues.athletesPerSport),
                    Winter: normalize(winterEfficiency.athletesPerSport, maxValues.athletesPerSport)
                },
                {
                    metric: 'Media per Athlete (%)',
                    Summer: normalize(summerEfficiency.mediaPerAthlete, maxValues.mediaPerAthlete),
                    Winter: normalize(winterEfficiency.mediaPerAthlete, maxValues.mediaPerAthlete)
                },
                {
                    metric: 'Cost per Venue (%)',
                    Summer: normalize(summerEfficiency.costPerVenue, maxValues.costPerVenue),
                    Winter: normalize(winterEfficiency.costPerVenue, maxValues.costPerVenue)
                },
                {
                    metric: 'Revenue per Event (%)',
                    Summer: normalize(summerEfficiency.revenuePerEvent, maxValues.revenuePerEvent),
                    Winter: normalize(winterEfficiency.revenuePerEvent, maxValues.revenuePerEvent)
                }
            ];
        }
    };

    if (loading) {
        return (
            <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
                <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                    ⚡ Summer vs Winter Olympic Efficiency Analysis
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Radar Chart
                    </span>
                </h3>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
                <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                    ⚡ Summer vs Winter Olympic Efficiency Analysis
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Radar Chart
                    </span>
                </h3>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="mb-4 text-6xl text-red-500">⚠️</div>
                        <p className="text-red-600 dark:text-red-400">Error loading data: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const radarData = getRadarData();

    return (
        <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
            <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                ⚡ Summer vs Winter Olympic Efficiency Analysis
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    Radar Chart
                </span>
            </h3>

            {/* Display Mode Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Display Mode:</span>
                        <div className="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-700">
                            <button
                                onClick={() => setDisplayMode('percentage')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    displayMode === 'percentage'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Percentage (%)
                            </button>
                            <button
                                onClick={() => setDisplayMode('absolute')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    displayMode === 'absolute'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Absolute Values
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {displayMode === 'percentage'
                            ? 'Normalized to show relative performance (0-100%)'
                            : 'Actual values scaled for visualization'
                        }
                    </p>
                </div>
            </div>

            <div className="mt-6">
                <div className="h-96 md:h-[500px]">
                    <ResponsiveRadar
                        data={radarData}
                        keys={['Summer', 'Winter']}
                        indexBy="metric"
                        valueFormat={displayMode === 'percentage' ? ">-.1f" : ">-.0f"}
                        margin={{ top: 60, right: 80, bottom: 60, left: 80 }}
                        borderColor={{ from: 'color' }}
                        gridLevels={5}
                        gridShape="linear"
                        gridLabelOffset={36}
                        enableDots={true}
                        dotSize={8}
                        dotColor={{ theme: 'background' }}
                        dotBorderWidth={2}
                        colors={['#fd9a00', '#00b8db']} // Orange for Summer, Blue for Winter (matching BoxPlot)
                        fillOpacity={0.15}
                        blendMode="normal"
                        motionConfig="gentle"
                        legends={[
                            {
                                anchor: 'top-left',
                                direction: 'column',
                                translateX: -50,
                                translateY: -40,
                                itemWidth: 80,
                                itemHeight: 20,
                                itemTextColor: '#fff',
                                symbolSize: 12,
                                symbolShape: 'circle',
                                effects: [
                                    {
                                        on: 'hover',
                                        style: {
                                            itemTextColor: '#ccc'
                                        }
                                    }
                                ]
                            }
                        ]}
                        tooltip={({ index, value, color, formattedValue }) => (
                            <div className="p-3 text-white bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
                                <div className="mb-2 font-bold">{radarData[index]?.metric}</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-sm text-gray-300">
                                        {color === '#fd9a00' ? 'Summer Olympics' : 'Winter Olympics'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Value:</span>
                                    <span>{formattedValue}</span>
                                </div>
                            </div>
                        )}

                        theme={{
                            background: 'transparent',
                            text: {
                                fontSize: 12,
                                fill: '#fff',
                                fontWeight: 600,
                                outlineWidth: 0,
                                outlineColor: 'transparent'
                            },
                            axis: {
                                legend: {
                                    text: {
                                        fill: '#fff',
                                        fontSize: 14,
                                        fontWeight: 600
                                    }
                                },
                                ticks: {
                                    text: {
                                        fill: '#fff',
                                        fontSize: 11
                                    },
                                    line: {
                                        stroke: '#444'
                                    }
                                }
                            },
                            grid: {
                                line: {
                                    stroke: '#444',
                                    strokeWidth: 1
                                }
                            },
                            tooltip: {
                                container: {
                                    background: '#0f1724',
                                    color: '#fff'
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Efficiency Metrics Info Cards */}
            <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border border-red-200 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 dark:border-red-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <h4 className="font-semibold text-red-700 dark:text-red-300">Summer Olympics</h4>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {displayMode === 'percentage'
                            ? 'Relative performance compared to Winter Olympics in each metric'
                            : 'Economies of scale: Lower cost per athlete, higher revenue per athlete'
                        }
                    </p>
                </div>

                <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">Winter Olympics</h4>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        {displayMode === 'percentage'
                            ? 'Relative performance shows specialization and efficiency patterns'
                            : 'Specialized events: Higher costs per athlete, more media coverage per participant'
                        }
                    </p>
                </div>

                <div className="p-4 border rounded-lg border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 dark:border-amber-700 md:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300">
                            {displayMode === 'percentage' ? 'Percentage View' : 'Absolute Values'}
                        </h4>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        {displayMode === 'percentage'
                            ? 'Normalized comparison showing which Olympics performs better in each category'
                            : 'Real values: $K = thousands USD, $M = millions USD. Based on Harvard dataset averages.'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SummerWinterRadarChart;
