'use client';

import React, {useEffect, useState} from 'react';
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import {getColorFromPalet} from '../utility';
import SectionGraphHeadline from "@/app/graphs/components/templates/SectionGraphHeadline";

const VenueSpread = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seasonFilter, setSeasonFilter] = useState('both'); // 'summer' | 'winter' | 'both'

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error || null);
    }, [geojsonData]);

    // Re-calculate data when season filter changes
    useEffect(() => {
        // Data will be recalculated automatically due to seasonFilter dependency in getDistanceData
    }, [seasonFilter]);

    // Process data for Distance Analysis (venue spread within host cities)
    const getDistanceData = () => {
        if (!data?.games) return [];

        const distanceData = [];

        data.games.forEach(game => {
            // Group features by season
            const featuresBySeason = {Summer: [], Winter: []};

            game.features.forEach(feature => {
                if (feature.properties.season && featuresBySeason[feature.properties.season]) {
                    featuresBySeason[feature.properties.season].push(feature);
                }
            });

            // Filter seasons based on seasonFilter
            let seasonsToProcess = [];
            if (seasonFilter === 'both') {
                seasonsToProcess = Object.entries(featuresBySeason);
            } else if (seasonFilter === 'summer') {
                seasonsToProcess = [['Summer', featuresBySeason.Summer]];
            } else if (seasonFilter === 'winter') {
                seasonsToProcess = [['Winter', featuresBySeason.Winter]];
            }

            // Create separate data points for each season that has venues
            seasonsToProcess.forEach(([season, features]) => {
                if (features.length < 2) return; // Need at least 2 venues for distance calculation

                // Calculate basic venue spread metrics for this season
                const coordinates = features
                    .filter(feature => feature.geometry && feature.geometry.coordinates)
                    .map(feature => ({
                        lat: feature.geometry.coordinates[1],
                        lng: feature.geometry.coordinates[0]
                    }));

                if (coordinates.length < 2) return;

                // Calculate bounding box dimensions (rough distance measure)
                const lats = coordinates.map(c => c.lat);
                const lngs = coordinates.map(c => c.lng);

                const latSpread = Math.max(...lats) - Math.min(...lats);
                const lngSpread = Math.max(...lngs) - Math.min(...lngs);

                // Rough distance in km (very approximate)
                const spreadKm = Math.sqrt(latSpread * latSpread + lngSpread * lngSpread) * 111; // 1 degree ≈ 111km

                distanceData.push({
                    id: `${game.year} ${game.location} - ${season}`,
                    data: [{
                        x: features.length, // Count of venues for this season
                        y: Math.round(spreadKm * 10) / 10,
                        year: game.year,
                        location: game.location,
                        season: season
                    }]
                });
            });
        });

        // Add colors to each series
        distanceData.forEach((series, index) => {
            series.color = getColorFromPalet(index, distanceData.length);
        });

        return distanceData;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <LoadingSpinner/>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-300">Error loading data: {error}</p>
        </div>
    );

    if (!data?.games || data.games.length === 0) return (
        <div
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-300">
                No Olympic venue data available
            </p>
        </div>
    );

    const distanceData = getDistanceData();

    // Process legend data grouped by season
    const getLegendData = () => {
        const legendData = {Summer: [], Winter: []};

        distanceData.forEach((series, seriesIndex) => {
            const seriesColor = getColorFromPalet(seriesIndex, distanceData.length);
            series.data.forEach(point => {
                const season = point.season;
                if (legendData[season]) {
                    legendData[season].push({
                        id: `${point.location} ${point.year}`,
                        location: point.location,
                        year: point.year,
                        venues: point.x,
                        spread: point.y,
                        color: seriesColor
                    });
                }
            });
        });

        // Sort by year within each season
        Object.keys(legendData).forEach(season => {
            legendData[season].sort((a, b) => a.year - b.year);
        });

        return legendData;
    };

    const legendData = getLegendData();

    return (
        <div
            className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
            <SectionGraphHeadline headline="Venue Spread"
                                  description="Analyse the relationship between the number of venues used in each Olympic Games and their geographic spread in kilometers."
                                  infoText=""
            >
            </SectionGraphHeadline>

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

            <div className="flex gap-6">
                <div className="flex-1 h-80 chart-container">
                    <style jsx>{`
                        .chart-container :global(text) {
                            fill: #d1d5db !important;
                            font-weight: 600 !important;
                        }
                    `}</style>
                    <ResponsiveScatterPlot
                        data={distanceData}
                        margin={{top: 20, right: 30, bottom: 60, left: 80}}
                        xScale={{type: 'linear', min: 0, max: 'auto'}}
                        yScale={{type: 'linear', min: 0, max: 'auto'}}
                        blendMode="normal"
                        colors={({serieId}) => {
                            const seriesIndex = distanceData.findIndex(s => s.id === serieId);
                            return getColorFromPalet(seriesIndex >= 0 ? seriesIndex : 0, distanceData.length);
                        }}
                        pointSize={8}
                        pointColor={{from: 'color'}}
                        pointBorderWidth={2}
                        pointBorderColor={{from: 'color', modifiers: [['darker', 0.3]]}}
                        useMesh={true}
                        enableGridX={true}
                        enableGridY={true}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Number of Venues',
                            legendOffset: 46,
                            legendPosition: 'middle'
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Venue Spread (km)',
                            legendOffset: -60,
                            legendPosition: 'middle'
                        }}
                        tooltip={({node}) => (
                            <div
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80 max-w-100">
                                <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {node.data.location} {node.data.year}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {node.data.season} Olympics
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span
                                            className="font-medium text-gray-700 dark:text-gray-300">Venue Count:</span>
                                        <span className="text-gray-900 dark:text-gray-100">{node.data.x} venues</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Geographic
                                            Spread:</span>
                                        <span
                                            className="text-gray-900 dark:text-gray-100 font-bold">{node.data.y} km</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Avg Spread per
                                            Venue:</span>
                                        <span className="text-gray-900 dark:text-gray-100">
                                            {(node.data.y / node.data.x).toFixed(1)} km
                                        </span>
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
                            }
                        }}
                    />
                </div>

                {/* Legend */}
                <div className="w-80 pl-4">
                    <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                        {/* Summer Olympics Column */}
                        <div>
                            {(seasonFilter === 'both' || seasonFilter === 'summer') && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Summer
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {legendData.Summer.length > 0 ? (
                                            legendData.Summer.map((item, index) => (
                                                <div key={item.id} className="text-xs">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <div
                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                            style={{backgroundColor: item.color}}
                                                        ></div>
                                                        <span className="text-gray-600 dark:text-gray-400 truncate">
                                                            {item.year} {item.location}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-500 dark:text-gray-500 text-xs ml-3">
                                                        {item.spread}km, {item.venues} venues
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                No summer data
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Winter Olympics Column */}
                        <div>
                            {(seasonFilter === 'both' || seasonFilter === 'winter') && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Winter
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {legendData.Winter.length > 0 ? (
                                            legendData.Winter.map((item, index) => (
                                                <div key={item.id} className="text-xs">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <div
                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                            style={{backgroundColor: item.color}}
                                                        ></div>
                                                        <span className="text-gray-600 dark:text-gray-400 truncate">
                                                            {item.year} {item.location}
                                                        </span>
                                                    </div>
                                                    <div className="text-gray-500 dark:text-gray-500 text-xs ml-3">
                                                        {item.spread}km, {item.venues} venues
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                No winter data
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Overall no data message */}
                    {seasonFilter === 'both' && legendData.Summer.length === 0 && legendData.Winter.length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic mt-4">
                            No data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VenueSpread;
