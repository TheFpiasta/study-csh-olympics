'use client';

import React, {useEffect, useState} from 'react';
import {ResponsivePie} from '@nivo/pie';
import {ResponsiveBar} from '@nivo/bar';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import SectionGraphHeadline from "@/app/graphs/components/templates/SectionGraphHeadline";
import {graphTheme} from "@/app/graphs/components/utility";
import geographicService from '../../../../components/geographicService';

const WorldGeographicAnalysis = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('continent'); // 'continent' or 'country'
    const [geoDataLoading, setGeoDataLoading] = useState(false);
    const [geoDataError, setGeoDataError] = useState(null);
    const [geoMapping, setGeoMapping] = useState(new Map());

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);
    }, [geojsonData]);

    // Load geographic data when component mounts or data changes
    useEffect(() => {
        if (!data?.games || data.games.length === 0) return;

        const loadGeographicData = async () => {
            setGeoDataLoading(true);
            setGeoDataError(null);

            try {
                // Extract unique city names from Olympic games data
                const uniqueCities = [...new Set(data.games.map(game => game.location))];

                // Fetch geographic info for all cities
                const geoResults = await geographicService.bulkGetGeographicInfo(uniqueCities);

                // Convert to Map for efficient lookup
                const geoMap = new Map();
                Object.entries(geoResults).forEach(([city, info]) => {
                    geoMap.set(city, info);
                });

                setGeoMapping(geoMap);
                console.log(`Loaded geographic data for ${geoMap.size} cities`);

            } catch (err) {
                console.error('Failed to load geographic data:', err);
                setGeoDataError(err.message);
            } finally {
                setGeoDataLoading(false);
            }
        };

        loadGeographicData();
    }, [data]);

    // Get country from location using API data
    const getCountryFromLocation = (location) => {
        const geoInfo = geoMapping.get(location);
        return geoInfo ? geoInfo.country : 'unknown country match';
    };

    // Get continent from location using API data
    const getContinent = (location) => {
        const geoInfo = geoMapping.get(location);
        return geoInfo ? geoInfo.continent : 'unknown continent match';
    };

    // Process data for Continental/Country Distribution
    const getDistributionData = () => {
        if (!data?.games || geoMapping.size === 0) return [];

        const distribution = {};

        data.games.forEach(game => {
            const region = viewMode === 'continent'
                ? getContinent(game.location)
                : getCountryFromLocation(game.location);

            if (!distribution[region]) {
                distribution[region] = {venues: 0, games: 0};
            }

            distribution[region].venues += game.venueCount;
            distribution[region].games += 1;
        });

        return Object.entries(distribution)
            .map(([region, data], index) => ({
                id: region,
                label: region,
                value: data.venues,
                games: data.games,
                color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8]
            }))
            .sort((a, b) => b.value - a.value);
    };

    // Process data for Venue Density Analysis (venues per game by region)
    const getDensityData = () => {
        if (!data?.games || geoMapping.size === 0) return [];

        const density = {};

        data.games.forEach(game => {
            const region = viewMode === 'continent'
                ? getContinent(game.location)
                : getCountryFromLocation(game.location);

            if (!density[region]) {
                density[region] = {totalVenues: 0, totalGames: 0};
            }

            density[region].totalVenues += game.venueCount;
            density[region].totalGames += 1;
        });

        return Object.entries(density)
            .map(([region, data]) => ({
                region,
                density: Math.round(data.totalVenues / data.totalGames * 10) / 10,
                totalVenues: data.totalVenues,
                totalGames: data.totalGames,
                color: '#6366f1'
            }))
            .sort((a, b) => b.density - a.density);
    };


    if (loading || geoDataLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <LoadingSpinner/>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {loading ? 'Loading Olympic data...' : 'Loading geographic data...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error || geoDataError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <p className="text-red-800 dark:text-red-300">
                    Error loading data: {error || geoDataError}
                </p>
            </div>
        );
    }

    if (!data || !data.games || data.games.length === 0) {
        return (
            <div
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <p className="text-yellow-800 dark:text-yellow-300">No Olympic data available for geographic
                    analysis</p>
            </div>
        );
    }

    const distributionData = getDistributionData();
    const densityData = getDensityData();

    return (
        <div className="space-y-8">

            {/* Distribution and Density Analysis */}
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">

                <SectionGraphHeadline headline="Geographic Distribution Analysis"
                                      description="Analyze the distribution and density of Olympic venues across countries and continents."
                                      infoText={[
                                          "In these diagrams, the venues are mapped to the respective countries and continents with the borders as of October 2025 according to geonames.org. For example, the 1984 Winter Games in Sarajevo are mapped to Bosnia and Herzegovina and Europe. However, in 1984, Bosnia and Herzegovina was part of Yugoslavia.",
                                          "Cities are assigned to the first cities that match them in the geonames.org dataset. This means that for cities that have the same name in multiple countries, the first match in the country is currently taken into account. For example, there are more games for Canada than there actually are, as the city of London is assigned to London (Canada) and not London (United Kingdom).",
                                      ]}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">View by:</span>
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('continent')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                        viewMode === 'continent'
                                            ? 'bg-emerald-500 text-white'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                    }`}
                                >
                                    Continent
                                </button>
                                <button
                                    onClick={() => setViewMode('country')}
                                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                        viewMode === 'country'
                                            ? 'bg-emerald-500 text-white'
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                    }`}
                                >
                                    Country
                                </button>
                            </div>
                        </div>
                    </div>
                </SectionGraphHeadline>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Venue Distribution Analysis */}
                    <div>
                        <div className="">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4 text-center">
                                Venue Distribution
                            </h4>
                        </div>
                        <div className="h-80 chart-container">
                            <style jsx>{`
                                .chart-container :global(text) {
                                    fill: #d1d5db !important;
                                    font-weight: 600 !important;
                                }
                            `}</style>
                            <ResponsivePie
                                data={distributionData}
                                margin={{top: 20, right: 80, bottom: 20, left: 80}}
                                innerRadius={0.4}
                                padAngle={1}
                                cornerRadius={3}
                                activeOuterRadiusOffset={8}
                                colors={({data}) => data.color}
                                borderWidth={1}
                                borderColor={{from: 'color', modifiers: [['darker', 0.2]]}}
                                arcLinkLabelsSkipAngle={10}
                                arcLinkLabelsTextColor="#d1d5db"
                                arcLinkLabelsThickness={2}
                                arcLinkLabelsColor={{from: 'color'}}
                                arcLabelsSkipAngle={10}
                                arcLabelsTextColor="#f3f4f6"
                                legends={[]}
                                tooltip={({datum}) => (
                                    <div
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-60 max-w-80">
                                        <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                            {datum.label}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {viewMode === 'continent' ? 'Continent' : 'Country'}
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Total
                                                    Venues:</span>
                                                <span className="text-gray-900 dark:text-gray-100">{datum.value}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                theme={graphTheme}
                            />
                        </div>
                    </div>

                    {/* Venue Density Analysis */}
                    <div>
                        <div className="">
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4 text-center">
                                Venue Density
                            </h4>
                        </div>
                        <div className="h-80 chart-container">
                            <style jsx>{`
                                .chart-container :global(text) {
                                    fill: #d1d5db !important;
                                    font-weight: 600 !important;
                                }
                            `}</style>
                            <ResponsiveBar
                                data={densityData}
                                keys={['density']}
                                indexBy="region"
                                margin={{top: 20, right: 30, bottom: 80, left: 60}}
                                padding={0.3}
                                colors={({data}) => data.color}
                                enableGridX={true}
                                enableGridY={true}
                                axisTop={null}
                                axisRight={null}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: -45
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Average Venues per Game',
                                    legendOffset: -50,
                                    legendPosition: 'middle'
                                }}
                                labelTextColor="#f3f4f6"
                                tooltip={({data}) => (
                                    <div
                                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-60 max-w-80">
                                        <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                            {data.region}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {viewMode === 'continent' ? 'Continent' : 'Country'} Venue Density
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Avg
                                                    Venues per Game:</span>
                                                <span
                                                    className="text-gray-900 dark:text-gray-100 font-bold">{data.density}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Total
                                                    Venues:</span>
                                                <span
                                                    className="text-gray-900 dark:text-gray-100">{data.totalVenues}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Olympic
                                                    Games:</span>
                                                <span
                                                    className="text-gray-900 dark:text-gray-100">{data.totalGames}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                theme={graphTheme}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default WorldGeographicAnalysis;
