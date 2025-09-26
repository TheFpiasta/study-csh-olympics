'use client';

import React, {useEffect, useState} from 'react';
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import {getColorFromPalet} from '../utility';

const SERIES_COLORS = {
    athletes: {Summer: '#8D5524', Winter: '#FFDFCC'},
    events: {Summer: '#c71a54ff', Winter: '#4e99ccff'},
    countries: {Summer: '#c7c957ff', Winter: '#38c991ff'}
};

const BUTTON_CONFIG = [
    {key: 'athletes', label: 'Athletes'},
    {key: 'events', label: 'Events'},
    {key: 'countries', label: 'Countries'},
];


const OlympicLineChart = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seasonFilter, setSeasonFilter] = useState('both');
    const [selectedSeries, setSelectedSeries] = useState('athletes'); // Start with 'athletes'

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);
    }, [geojsonData]);

    const getSeason = (game) => {
        for (const feature of game.features) {
            if (Array.isArray(feature.properties.games)) {
                const matchingGame = feature.properties.games.find((g) => g.year == game.year);
                if (matchingGame?.season) return matchingGame.season;
            }
        }
        return 'Unknown';
    };

    const getXAxisTicks = () => {
        const years = scatterData.length > 0 ? scatterData[0].data.map(d => d.x) : [];
        const minYear = Math.min(...years, 1964);

        if (seasonFilter === 'summer') {
            return years.filter(y => (y - 1964) % 4 === 0);
        }

        if (seasonFilter === 'winter') {
            const ticks = [];
            let switched = false;
            for (let i = 0; i < years.length; i++) {
                const y = years[i];
                if (!switched) {
                    if ((y - 1964) % 4 === 0) {
                        ticks.push(y);
                        if (y === 1992 && years[i + 1] === 1994) {
                            ticks.push('...');
                            switched = true;
                        }
                    }
                } else {
                    if ((y - 1994) % 2 === 0 && y >= 1994) {
                        ticks.push(y);
                    }
                }
            }
            return ticks;
        }

        // Both seasons: every 2 years
        return years.filter(y => (y - minYear) % 2 === 0);
    };


    const getSeasonData = () => {
        const result = [];
        const summerGames = [];
        const winterGames = [];

        data.games.forEach((game) => {
            const summerFeatures = game.features.filter((feature) => feature.properties.season === 'Summer');
            const winterFeatures = game.features.filter((feature) => feature.properties.season === 'Winter');

            if (summerFeatures.length > 0 && (seasonFilter === 'both' || seasonFilter === 'summer')) {
                const summerSports = new Set();
                summerFeatures.forEach((feature) => {
                    if (feature.properties.sports) {
                        const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                        sports.forEach((sport) => summerSports.add(sport));
                    }
                });

                const summerVenueTypes = {};
                summerFeatures.forEach((feature) => {
                    const type = feature.properties.type || 'Unknown';
                    summerVenueTypes[type] = (summerVenueTypes[type] || 0) + 1;
                });

                summerGames.push({
                    x: game.year,
                    y: summerFeatures.length,
                    location: game.location,
                    season: 'Summer',
                    sportsCount: summerSports.size,
                    venueTypes: Object.entries(summerVenueTypes).map(([type, count]) => `${type}: ${count}`).join(', '),
                });
            }

            if (winterFeatures.length > 0 && (seasonFilter === 'both' || seasonFilter === 'winter')) {
                const winterSports = new Set();
                winterFeatures.forEach((feature) => {
                    if (feature.properties.sports) {
                        const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                        sports.forEach((sport) => winterSports.add(sport));
                    }
                });

                const winterVenueTypes = {};
                winterFeatures.forEach((feature) => {
                    const type = feature.properties.type || 'Unknown';
                    winterVenueTypes[type] = (winterVenueTypes[type] || 0) + 1;
                });

                winterGames.push({
                    x: game.year,
                    y: winterFeatures.length,
                    location: game.location,
                    season: 'Winter',
                    sportsCount: winterSports.size,
                    venueTypes: Object.entries(winterVenueTypes).map(([type, count]) => `${type}: ${count}`).join(', '),
                });
            }
        });

        if (summerGames.length > 0) {
            result.push({
                id: 'Summer',
                data: summerGames,
            });
        }

        if (winterGames.length > 0) {
            result.push({
                id: 'Winter',
                data: winterGames,
            });
        }

        return result;
    };

    const getScatterData = () => {
        if (!data?.games) return [];

        const validEntries = data.games.filter((g) => g.harvard && Object.keys(g.harvard).length > 0);

        const getFieldValue = (harvardObj, fieldName) => {
            if (!harvardObj || !harvardObj[fieldName] || harvardObj[fieldName].data === undefined || harvardObj[fieldName].data === null) return 0;
            const value = parseFloat(harvardObj[fieldName].data);
            return isNaN(value) ? 0 : value;
        };

        const series = [];

        ['athletes', 'events', 'countries'].forEach((type) => {
            ['Summer', 'Winter'].forEach((season) => {
                const seriesData = validEntries
                    .filter((e) => getSeason(e) === season)
                    .map((e) => ({
                        x: e.year,
                        y: getFieldValue(e.harvard, `number_of_${type}`),
                        location: e.location,
                        season,
                    }));

                if (seriesData.length > 0) {
                    series.push({
                        id: `${type}-${season}`,
                        data: seriesData,
                    });
                }
            });
        });

        return series;
    };

    // Filter scatterData based on selectedSeries
    const getFilteredScatterData = () => {
        if (!scatterData || scatterData.length === 0) return [];

        return scatterData.filter((series) => {
            // Filter by selected series (athletes/events/countries)
            if (selectedSeries === 'athletes' && !series.id.startsWith('athletes')) return false;
            if (selectedSeries === 'events' && !series.id.startsWith('events')) return false;
            if (selectedSeries === 'countries' && !series.id.startsWith('countries')) return false;

            // Filter by season
            if (seasonFilter === 'both') return true;
            if (seasonFilter === 'summer') return series.id.endsWith('Summer');
            if (seasonFilter === 'winter') return series.id.endsWith('Winter');
            return true;
        });
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

    const scatterData = getScatterData();

    const getYearRange = () => {
        if (!data?.games) return {min: 'auto', max: 'auto'};

        const harvardGames = data.games.filter((game) => game.harvard);

        if (harvardGames.length === 0) return {min: 'auto', max: 'auto'};

        const years = harvardGames.map((game) => game.year);

        return {
            min: Math.min(...years),
            max: Math.max(...years),
        };
    };

    return (
        <div className="space-y-8">
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">

                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                    Olympic Participation Over Time
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    </span>
                </h3>

                {/* Olympic Season Selector */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Olympic Season
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSeasonFilter('both')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                seasonFilter === 'both'
                                    ? 'bg-violet-500 text-white'
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

                {/* Data Type Selector */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {BUTTON_CONFIG.map(({key, label}, index) => (
                            <button
                                key={key}
                                onClick={() => setSelectedSeries(key)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    selectedSeries === key
                                        ? `text-white`
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                                style={
                                    selectedSeries === key
                                        ? {
                                            backgroundColor: getColorFromPalet(index, BUTTON_CONFIG.length, 0.75),
                                        }
                                        : {}
                                }
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scatter Plot */}
                <div className="h-80 chart-container">
                    <style jsx>{`
                        .chart-container :global(text) {
                            fill: #d1d5db !important;
                            font-weight: 600 !important;
                        }
                    `}</style>
                    <ResponsiveScatterPlot
                        data={getFilteredScatterData()}
                        margin={{top: 20, right: 30, bottom: 50, left: 60}}
                        xScale={{type: 'linear', min: getYearRange().min, max: getYearRange().max}}
                        yScale={{type: 'linear', min: 0, max: 'auto'}}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            orient: 'bottom',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: 'Year',
                            legendOffset: 36,
                            legendPosition: 'middle',
                            tickValues: getXAxisTicks(),
                            format: value => value === '...' ? '...' : value,
                        }}
                        axisLeft={{
                            orient: 'left',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: `Number of ${selectedSeries.charAt(0).toUpperCase() + selectedSeries.slice(1)}`,
                            legendOffset: -50,
                            legendPosition: 'middle',
                            format: value => value.toLocaleString()
                        }}
                        nodeSize={8}
                        enableGridX={true}
                        enableGridY={true}
                        useMesh={true}
                        colors={node => {
                            const season = node.data?.season || (node.serieId.includes('Summer') ? 'Summer' : 'Winter');
                            // Match the season filter button colors
                            return season === 'Summer' ? '#f59e0b' : '#06b6d4';
                        }}
                        tooltip={({node}) => (
                            <div
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80 max-w-100">
                                <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {node.data.location} {node.data.x}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {node.data.season} Olympics
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            {node.serieId.split('-')[0].charAt(0).toUpperCase() + node.serieId.split('-')[0].slice(1)}:
                                        </span>
                                        <span className="text-gray-900 dark:text-gray-100 font-bold">
                                            {node.data.y.toLocaleString()}
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

                {/* Dynamic Custom Legend */}
                <div className="flex justify-center mt-2 flex-wrap gap-4">
                    {seasonFilter === 'both' ? (
                        // Show both seasons when filter is 'both'
                        ['Summer', 'Winter'].map((season) => (
                            <div key={season} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{backgroundColor: season === 'Summer' ? '#f59e0b' : '#06b6d4'}}
                                ></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {selectedSeries.charAt(0).toUpperCase() + selectedSeries.slice(1)} ({season})
                                </span>
                            </div>
                        ))
                    ) : (
                        // Show only selected season when filter is specific
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{backgroundColor: seasonFilter === 'summer' ? '#f59e0b' : '#06b6d4'}}
                            ></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                {selectedSeries.charAt(0).toUpperCase() + selectedSeries.slice(1)} ({seasonFilter === 'summer' ? 'Summer' : 'Winter'})
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OlympicLineChart;
