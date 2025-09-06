'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import LoadingSpinner from './LoadingSpinner';

const OlympicScatterPlot = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scatterSeasonFilter, setScatterSeasonFilter] = useState('both');
    const [selectedSeries, setSelectedSeries] = useState('all'); // 'all' | 'athletes' | 'events' | 'countries'


    // Fetch Olympic JSON
    useEffect(() => {
        const fetchData = async () => {
        try {
            const response = await fetch('/api/olympics/all', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            });

            if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Olympic data: ${response.status} ${errorText}`);
            }

            const olympicData = await response.json();
            console.log("✅ Raw Olympic data from API:", olympicData); // <-- log the raw API response
            setData(olympicData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        };

        fetchData();
    }, []);

    const getSeason = (game) => {
        // Try to get season from the first feature that matches the game year
        for (const feature of game.features) {
            if (Array.isArray(feature.properties.games)) {
                const matchingGame = feature.properties.games.find(g => g.year == game.year);
                if (matchingGame?.season) return matchingGame.season;
            }
        }
        return "Unknown"; // fallback
    };

    const getSeasonData = () => {
        const result = [];
        const summerGames = [];
        const winterGames = [];

        // Process each game and separate venues by season
        data.games.forEach(game => {
            const summerFeatures = game.features.filter(feature => feature.properties.season === 'Summer');
            const winterFeatures = game.features.filter(feature => feature.properties.season === 'Winter');

            // Add summer data if there are summer venues and filter allows it
            if (summerFeatures.length > 0 && (scatterSeasonFilter === 'both' || scatterSeasonFilter === 'summer')) {
                const summerSports = new Set();
                summerFeatures.forEach(feature => {
                    if (feature.properties.sports) {
                        const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                        sports.forEach(sport => summerSports.add(sport));
                    }
                });

                const summerVenueTypes = {};
                summerFeatures.forEach(feature => {
                    const type = feature.properties.type || 'Unknown';
                    summerVenueTypes[type] = (summerVenueTypes[type] || 0) + 1;
                });

                summerGames.push({
                    x: game.year,
                    y: summerFeatures.length,
                    location: game.location,
                    season: 'Summer',
                    sportsCount: summerSports.size,
                    venueTypes: Object.entries(summerVenueTypes).map(([type, count]) => `${type}: ${count}`).join(', ')
                });
            }

            // Add winter data if there are winter venues and filter allows it
            if (winterFeatures.length > 0 && (scatterSeasonFilter === 'both' || scatterSeasonFilter === 'winter')) {
                const winterSports = new Set();
                winterFeatures.forEach(feature => {
                    if (feature.properties.sports) {
                        const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                        sports.forEach(sport => winterSports.add(sport));
                    }
                });

                const winterVenueTypes = {};
                winterFeatures.forEach(feature => {
                    const type = feature.properties.type || 'Unknown';
                    winterVenueTypes[type] = (winterVenueTypes[type] || 0) + 1;
                });

                winterGames.push({
                    x: game.year,
                    y: winterFeatures.length,
                    location: game.location,
                    season: 'Winter',
                    sportsCount: winterSports.size,
                    venueTypes: Object.entries(winterVenueTypes).map(([type, count]) => `${type}: ${count}`).join(', ')
                });
            }
        });

        if (summerGames.length > 0) {
            result.push({
                id: 'Summer',
                data: summerGames
            });
        }

        if (winterGames.length > 0) {
            result.push({
                id: 'Winter',
                data: winterGames
            });
        }

        return result;
    };

    // Transform data for Nivo ScatterPlot (Athletes, Events, Countries)
    const getScatterData = () => {
        if (!data?.games || !Array.isArray(data.games)) {
            console.log("Games data is missing or not an array:", data);
            return [];
        }

        // Filter out entries that don't have Harvard data
        const validEntries = data.games.filter(entry => Array.isArray(entry.harvard) && entry.harvard.length > 0);

        if (validEntries.length === 0) {
            console.log("No entries with Harvard data found.");
            return [];
        }

        // Helper to find the data for a given field
        const getFieldValue = (harvardArray, fieldName) => {
            const obj = harvardArray.find(item => item.field === fieldName);
            return obj ? parseFloat(obj.data) : 0;
        };

        const athletesData = validEntries.map(entry => ({
            x: entry.year?.toString() || "Unknown",
            y: getFieldValue(entry.harvard, "number_of_athletes"), 
            location: entry.location,
            season: getSeason(entry)
        }));

        const eventsData = validEntries.map(entry => ({
            x: entry.year?.toString() || "Unknown",
            y: getFieldValue(entry.harvard, "number_of_events"),
            location: entry.location,
            season: getSeason(entry)
        }));

        const countriesData = validEntries.map(entry => ({
            x: entry.year?.toString() || "Unknown",
            y: getFieldValue(entry.harvard, "number_of_countries"),
            location: entry.location,
            season: getSeason(entry)
        }));

        return [
            { id: "athletes", color: "#3b82f6", data: athletesData },
            { id: "Events", color: "#10b981", data: eventsData },
            { id: "Countries", color: "#f59e0b", data: countriesData }
        ];
    };

    // Filter scatterData based on selectedSeries
    const getFilteredScatterData = () => {
        if (!scatterData || scatterData.length === 0) return [];

        if (selectedSeries === 'all') return scatterData;

        return scatterData.filter(series => {
            if (selectedSeries === 'athletes') return series.id.toLowerCase() === 'athletes';
            if (selectedSeries === 'events') return series.id.toLowerCase() === 'events';
            if (selectedSeries === 'countries') return series.id.toLowerCase() === 'countries';
            return false;
        });
    };

    // Get colors for scatter plot based on current view mode and filter
    const getColors = () => {
        const shadeColor = (color, percent) => {
            const f = parseInt(color.slice(1),16),
                t = percent < 0 ? 0 : 255,
                p = Math.abs(percent)/100,
                R = f >> 16,
                G = f >> 8 & 0x00FF,
                B = f & 0x0000FF;
            return "#" + (
                0x1000000 +
                (Math.round((t-R)*p)+R)*0x10000 +
                (Math.round((t-G)*p)+G)*0x100 +
                (Math.round((t-B)*p)+B)
            ).toString(16).slice(1);
        };

        return node => {
            if (!node?.data) return "#570606ff";

            // Use serieId if available, fallback to id
            const serie = (node.serieId || node.id || '').toLowerCase();

            console.log('Node data:', node);
            let baseColor = serie === 'athletes' ? '#3b82f6'
                        : serie === 'events' ? '#10b981'
                        : serie === 'countries' ? '#f59e0b'
                        : '#888888';

            if (node.data.season?.toLowerCase() === 'summer') return baseColor;
            if (node.data.season?.toLowerCase() === 'winter') return shadeColor(baseColor, -25);

            return baseColor;
        }
    };



    if (loading) {
        return (
        <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
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


  // Get min and max years from all data
    const getYearRange = () => {
        if (!data?.games) return { min: 'auto', max: 'auto' };

        // Filter games that have Harvard data
        const harvardGames = data.games.filter(game => game.harvard);

        if (harvardGames.length === 0) return { min: 'auto', max: 'auto' };

        const years = harvardGames.map(game => game.year);

        return {
            min: Math.min(...years),
            max: Math.max(...years)
        };
    };

    return (
        <div className="space-y-8">
            <div
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-600/20 dark:to-orange-600/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                        ⏳ Temporal development analyses
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                            Infrastructure Evolution Over Time
                        </span>
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Analysis of the number of athletes, events, and countries over the years in Olympic Games
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Points
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedSeries('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedSeries === 'all'
                                ? 'bg-violet-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        All Points
                    </button>
                    <button
                        onClick={() => setSelectedSeries('athletes')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedSeries === 'athletes'
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        Athletes
                    </button>
                    <button
                        onClick={() => setSelectedSeries('events')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedSeries === 'events'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => setSelectedSeries('countries')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            selectedSeries === 'countries'
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        Countries
                    </button>
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
    yScale={{type: 'linear', min: 'auto', max: 'auto'}}
    axisTop={null}
    axisRight={null}
    axisBottom={{
        orient: 'bottom',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0
    }}
    axisLeft={{
        orient: 'left',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0
    }}
    colors={node => {
        if (!node || !node.data) return "#888888"; // safe fallback

        const serie = (node.serieId || node.id || '').toLowerCase();
        let baseColor =
            serie === 'athletes' ? '#3b82f6' :
            serie === 'events' ? '#10b981' :
            serie === 'countries' ? '#f59e0b' :
            '#888888';

        // adjust for season
        //if (node.data.season?.toLowerCase() === 'summer') return baseColor;
        //if (node.data.season?.toLowerCase() === 'winter') return shadeColor(baseColor, -25);

        return baseColor;
    }}
    nodeSize={8}
    useMesh={true}
    tooltip={({ node }) => (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80 max-w-96">
            <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                {node.data.location} {node.data.x}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {node.data.season} Olympics
            </div>
            <div className="space-y-2">
                {node.serieId.toLowerCase() === 'athletes' && (
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Athletes:</span>
                        <span className="text-gray-900 dark:text-gray-100">{node.data.y}</span>
                    </div>
                )}
                {node.serieId.toLowerCase() === 'events' && (
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Events:</span>
                        <span className="text-gray-900 dark:text-gray-100">{node.data.y}</span>
                    </div>
                )}
                {node.serieId.toLowerCase() === 'countries' && (
                    <div className="flex justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Countries:</span>
                        <span className="text-gray-900 dark:text-gray-100">{node.data.y}</span>
                    </div>
                )}
            </div>
        </div>
    )}
    legends={[]}
    theme={{
        background: 'transparent',
        tooltip: {
            container: {
                background: '#ffffff',
                color: '#374151',
                fontSize: '12px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '8px 12px'
            }
        },
        axis: {
            ticks: { text: { fontSize: 11, fill: '#d1d5db', fontWeight: 600 } },
            legend: { text: { fontSize: 12, fill: '#d1d5db', fontWeight: 600 } }
        }
    }}
/>

            </div>

            {/* Custom Legend */}
            <div className="flex justify-center mt-2 flex-wrap gap-4">
                {getSeasonData().map((series, index) => (
                    <div key={series.id} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: getColors()[index]}}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {series.id}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

};

export default OlympicScatterPlot;
