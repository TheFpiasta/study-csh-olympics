'use client';

import React, {useEffect, useState} from 'react';
import {ResponsiveSunburst} from '@nivo/sunburst';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import SectionGraphHeadline from "@/app/graphs/components/templates/SectionGraphHeadline";
import {graphTheme} from "@/app/graphs/components/utility";

const LegendItem = ({category, selectedOlympics}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const totalPlaces = category.children ? category.children.length : 0;
    const totalVenues = category.children ? category.children.reduce((sum, place) => sum + place.value, 0) : 0;

    return (
        <div className="mb-3">
            <div
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Color Square */}
                <div
                    className="w-4 h-4 rounded"
                    style={{backgroundColor: category.color}}
                />

                {/* Category Name and Count */}
                <div className="flex-1 flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {category.name || category.id}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({totalVenues} venues)
                    </span>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="text-gray-500 dark:text-gray-400 transition-transform">
                    {isExpanded ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                    )}
                </div>
            </div>

            {/* Expandable Places List */}
            {isExpanded && category.children && (
                <div className="ml-7 mt-2 space-y-1">
                    {category.children.map((place) => (
                        <div key={place.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded"
                                    style={{backgroundColor: place.color}}
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                    {place.name || place.placeName}
                                </span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-500">
                                {place.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Function to convert hex to RGB
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Function to generate child colors from parent color (light to dark gradient)
const generateChildColors = (parentColor, childCount) => {
    const rgb = hexToRgb(parentColor);
    if (!rgb) return [parentColor];

    const colors = [];
    const baseOpacity = 0.6; // Fixed opacity
    const lightnessFrom = 0.8; // Light end of gradient
    const lightnessTo = 0.0; // Dark end of gradient
    const singleChildDefault = 0.6; // Default lightness for single child

    for (let i = 0; i < childCount; i++) {
        // Create gradient from light to dark
        const lightnessFactor = childCount === 1 ? singleChildDefault : lightnessFrom - (i / (childCount - 1)) * (lightnessFrom - lightnessTo);

        // Apply lightness factor to make gradient from light to dark
        const adjustedR = Math.round(rgb.r + (255 - rgb.r) * (lightnessFactor - 0.5) * 2);
        const adjustedG = Math.round(rgb.g + (255 - rgb.g) * (lightnessFactor - 0.5) * 2);
        const adjustedB = Math.round(rgb.b + (255 - rgb.b) * (lightnessFactor - 0.5) * 2);

        // Ensure values stay within 0-255 range
        const finalR = Math.max(0, Math.min(255, adjustedR));
        const finalG = Math.max(0, Math.min(255, adjustedG));
        const finalB = Math.max(0, Math.min(255, adjustedB));

        colors.push(`rgba(${finalR}, ${finalG}, ${finalB}, ${baseOpacity})`);
    }

    return colors;
};

const CityGeoAnalysis = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOlympics, setSelectedOlympics] = useState(''); // will default to latest game

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error || null);

        // Set default to latest game
        if (geojsonData.data?.games?.length) {
            const latestGame = geojsonData.data.games[geojsonData.data.games.length - 1];
            setSelectedOlympics(`${latestGame.location} ${latestGame.year}`);
        }
    }, [geojsonData]);

    // Filter data by selected Olympics
    const getFilteredGames = () => {
        if (!data?.games) return [];
        if (!selectedOlympics) return []; // no default yet
        return data.games.filter(game => `${game.location} ${game.year}` === selectedOlympics);
    };

    const getDistributionData = () => {
        const gamesToUse = getFilteredGames();
        if (!gamesToUse.length) return [];

        const distribution = {};

        gamesToUse.forEach(game => {
            game.features.forEach(feature => {
                const location = feature.properties.location?.toLowerCase() || '';
                const place = feature.properties.place || '';
                let locationCategory;

                if (location.includes('inside')) {
                    locationCategory = 'Inside City';
                } else if (location.includes('outside')) {
                    locationCategory = 'Outside City';
                } else if ((location.includes('undefined') || !location) && place) {
                    locationCategory = 'By Location';
                } else {
                    locationCategory = 'No Information';
                }

                const placeName = place || 'Unknown Place';

                if (!distribution[locationCategory]) {
                    distribution[locationCategory] = {};
                }

                if (!distribution[locationCategory][placeName]) {
                    distribution[locationCategory][placeName] = 0;
                }

                distribution[locationCategory][placeName] += 1;
            });
        });

        // Transform to proper Sunburst format with nested children structure
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
            '#6366f1', '#14b8a6', '#f43f5e', '#e879f9',
            '#22c55e', '#facc15', '#0ea5e9', '#f87171'
        ];

        let colorIndex = 0;
        const sunburstData = [];

        Object.entries(distribution).forEach(([locationCategory, places]) => {

            let baseColor
            switch (locationCategory) {
                case 'Inside City':
                    baseColor = colors[0];
                    break;
                case 'Outside City':
                    baseColor = colors[1];
                    break;
                case 'By Location':
                    baseColor = colors[2];
                    break;
                case 'No Information':
                    baseColor = colors[3];
                    break;
                default:
                    baseColor = colors[4];
            }

            // const baseColor = colors[colorIndex % colors.length];
            const children = [];
            const placeEntries = Object.entries(places);
            // const childColors = generateChildColors(baseColor, placeEntries.length);

            // Create children for each place with gradient colors from light to dark
            placeEntries.forEach(([placeName, count], index) => {
                children.push({
                    id: `${locationCategory}_${placeName}`,
                    name: placeName,
                    value: count,
                    // color: childColors[index],
                    placeName: placeName,
                    locationCategory: locationCategory
                });
            });

            // Add parent location category with children
            sunburstData.push({
                id: locationCategory,
                name: locationCategory,
                color: baseColor,
                children: children
            });

            colorIndex++;
        });

        // Sort categories in specific order
        const categoryOrder = {
            'Inside City': 1,
            'Outside City': 2,
            'By Location': 3,
            'No Information': 4
        };
        sunburstData.sort((a, b) => {
            const orderA = categoryOrder[a.id] || 999;
            const orderB = categoryOrder[b.id] || 999;
            return orderA - orderB;
        });

        // sort for each category the children by name
        sunburstData.forEach(category => {
            category.children.sort((a, b) => a.name.localeCompare(b.name));
        });

        // apply child colors after sorting
        sunburstData.forEach(category => {
            const childColors = generateChildColors(category.color, category.children.length);
            category.children.forEach((child, index) => {
                child.color = childColors[index];
            });
        });

        return sunburstData;
    };

    // --- Rendering states ---
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

    const distributionData = getDistributionData();

    return (
        <div className="space-y-6">
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <SectionGraphHeadline headline="Venues Locations Inside The Event"
                                      description="Explore the distribution of Olympic venues located inside or near the main event city for selected Olympic Games."
                                      infoText=""
                >
                </SectionGraphHeadline>

                {/* Select Olympics Filter */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 py-6">
                    <div className="flex items-center gap-4">
                        <label htmlFor="olympics-select"
                               className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Olympics
                        </label>
                        <select
                            id="olympics-select"
                            value={selectedOlympics}
                            onChange={(e) => setSelectedOlympics(e.target.value)}
                            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 rounded-md p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            {data.games.map(game => (
                                <option key={`${game.location}-${game.year}`} value={`${game.location} ${game.year}`}>
                                    {game.location} {game.year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Chart and Legend Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart Section */}
                    <div className="lg:col-span-1">
                        <div className="h-96 chart-container">
                            <style jsx>{`
                                .chart-container :global(text) {
                                    fill: #d1d5db !important;
                                    font-weight: 600 !important;
                                }
                            `}</style>
                            <ResponsiveSunburst
                                data={{
                                    id: 'root',
                                    name: 'Olympic Venues',
                                    children: distributionData
                                }}
                                margin={{top: 1, right: 1, bottom: 1, left: 1}}
                                cornerRadius={3}
                                borderWidth={1}
                                borderColor={{from: 'color', modifiers: [['darker', 0.2]]}}
                                inheritColorFromParent={false}
                                colors={(node) => node.data.color}
                                enableArcLabels={true}
                                arcLabelsSkipAngle={10}
                                arcLabelsTextColor="#f3f4f6"
                                arcLabel={(d) => `${d.value}`}
                                animate={true}
                                motionConfig="gentle"
                                tooltip={({id, value, data, depth}) => {
                                    const isChild = depth === 2; // depth 2 means it's a leaf node (place)
                                    const totalVenues = distributionData
                                        .reduce((sum, location) => {
                                            return sum + location.children.reduce((childSum, place) => childSum + place.value, 0);
                                        }, 0);

                                    return (
                                        <div
                                            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-60 max-w-80">
                                            <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                                {selectedOlympics}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                Venue Location Distribution
                                            </div>
                                            <div className="space-y-2">
                                                {isChild ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                                                            <span
                                                                className="text-gray-900 dark:text-gray-100">{data.locationCategory}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="font-medium text-gray-700 dark:text-gray-300">Place:</span>
                                                            <span
                                                                className="text-gray-900 dark:text-gray-100">{data.name || data.placeName}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="font-medium text-gray-700 dark:text-gray-300">Venues:</span>
                                                            <span
                                                                className="text-gray-900 dark:text-gray-100">{value}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="font-medium text-gray-700 dark:text-gray-300">Percentage:</span>
                                                            <span
                                                                className="text-gray-900 dark:text-gray-100">{Math.round(value / totalVenues * 100)}%</span>
                                                        </div>
                                                    </>
                                                ) : depth === 1 ? (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                                                            <span
                                                                className="text-gray-900 dark:text-gray-100">{data.name || id}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="font-medium text-gray-700 dark:text-gray-300">Total
                                                                Venues:</span>
                                                            <span
                                                                className="text-gray-900 dark:text-gray-100">{value}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="font-medium text-gray-700 dark:text-gray-300">Percentage:</span>
                                                            <span
                                                                className="text-gray-900 dark:text-gray-100">{Math.round(value / totalVenues * 100)}%</span>
                                                        </div>
                                                    </>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                }}
                                theme={graphTheme}
                            />
                        </div>
                    </div>

                    {/* Legend Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            {/*<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Legend</h3>*/}
                            {distributionData.map((locationCategory) => (
                                <LegendItem
                                    key={locationCategory.id}
                                    category={locationCategory}
                                    selectedOlympics={selectedOlympics}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CityGeoAnalysis;
