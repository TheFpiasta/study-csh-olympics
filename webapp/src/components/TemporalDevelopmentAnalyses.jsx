'use client';

import React, {useState, useEffect} from 'react';
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import {ResponsiveBar} from '@nivo/bar';
import {ResponsiveSankey} from '@nivo/sankey';
import LoadingSpinner from './LoadingSpinner';

const TemporalDevelopmentAnalyses = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [seasonFilter, setSeasonFilter] = useState('both');
    const [viewMode, setViewMode] = useState('season'); // 'season' or 'venue-type'
    const [classificationFilter, setClassificationFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/olympics/all', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to fetch Olympic data: ${response.status} ${errorText}`);
                }

                const olympicData = await response.json();
                setData(olympicData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Process data for Number of venues per Olympic Games (Scatter plot)
    const getVenuesPerGameData = () => {
        if (!data?.games) return [];

        if (viewMode === 'season') {
            return getSeasonData();
        } else {
            return getVenueTypeData();
        }
    };

    // Data grouped by season
    const getSeasonData = () => {
        const result = [];

        if (seasonFilter === 'both' || seasonFilter === 'summer') {
            const summerGames = data.games
                .filter(game => game.season === 'Summer')
                .map(game => {
                    const allSports = new Set();
                    game.features.forEach(feature => {
                        if (feature.properties.sports) {
                            const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                            sports.forEach(sport => allSports.add(sport));
                        }
                    });

                    const venueTypes = {};
                    game.features.forEach(feature => {
                        const type = feature.properties.type || 'Unknown';
                        venueTypes[type] = (venueTypes[type] || 0) + 1;
                    });

                    return {
                        x: game.year,
                        y: game.venueCount,
                        location: game.location,
                        season: game.season,
                        sportsCount: allSports.size,
                        venueTypes: Object.entries(venueTypes).map(([type, count]) => `${type}: ${count}`).join(', ')
                    };
                });

            result.push({
                id: 'Summer',
                data: summerGames
            });
        }

        if (seasonFilter === 'both' || seasonFilter === 'winter') {
            const winterGames = data.games
                .filter(game => game.season === 'Winter')
                .map(game => {
                    const allSports = new Set();
                    game.features.forEach(feature => {
                        if (feature.properties.sports) {
                            const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                            sports.forEach(sport => allSports.add(sport));
                        }
                    });

                    const venueTypes = {};
                    game.features.forEach(feature => {
                        const type = feature.properties.type || 'Unknown';
                        venueTypes[type] = (venueTypes[type] || 0) + 1;
                    });

                    return {
                        x: game.year,
                        y: game.venueCount,
                        location: game.location,
                        season: game.season,
                        sportsCount: allSports.size,
                        venueTypes: Object.entries(venueTypes).map(([type, count]) => `${type}: ${count}`).join(', ')
                    };
                });

            result.push({
                id: 'Winter',
                data: winterGames
            });
        }

        return result;
    };

    // Data grouped by venue type
    const getVenueTypeData = () => {
        const result = [];

        // Apply season filter
        let filteredGames = data.games;
        if (seasonFilter === 'summer') {
            filteredGames = data.games.filter(game => game.season === 'Summer');
        } else if (seasonFilter === 'winter') {
            filteredGames = data.games.filter(game => game.season === 'Winter');
        }

        // Get all unique venue types first
        const allVenueTypes = new Set();
        filteredGames.forEach(game => {
            game.features.forEach(feature => {
                const type = feature.properties.type || 'Unknown';
                allVenueTypes.add(type);
            });
        });

        // Create series for each venue type
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316'];
        let colorIndex = 0;

        allVenueTypes.forEach(venueType => {
            const typeData = filteredGames.map(game => {
                // Count venues of this type in this game
                const count = game.features.filter(feature =>
                    (feature.properties.type || 'Unknown') === venueType
                ).length;

                const allSports = new Set();
                game.features.forEach(feature => {
                    if (feature.properties.sports) {
                        const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                        sports.forEach(sport => allSports.add(sport));
                    }
                });

                return {
                    x: game.year,
                    y: count,
                    location: game.location,
                    season: game.season,
                    venueType: venueType,
                    sportsCount: allSports.size
                };
            }).filter(point => point.y > 0); // Only include games that have this venue type

            if (typeData.length > 0) {
                result.push({
                    id: venueType,
                    data: typeData,
                    color: colors[colorIndex % colors.length]
                });
                colorIndex++;
            }
        });

        return result;
    };

    // Get colors for scatter plot based on current view mode and filter
    const getScatterColors = () => {
        if (viewMode === 'venue-type') {
            const data = getVenueTypeData();
            return data.map(series => series.color);
        } else {
            // Season mode
            if (seasonFilter === 'summer') return ['#f59e0b'];
            if (seasonFilter === 'winter') return ['#06b6d4'];
            return ['#f59e0b', '#06b6d4']; // both
        }
    };

    // Process data for Ratio of new buildings to existing facilities
    const getNewVsExistingData = () => {
        if (!data?.games) return [];

        // Apply season filter
        let filteredGames = data.games;
        if (seasonFilter === 'summer') {
            filteredGames = data.games.filter(game => game.season === 'Summer');
        } else if (seasonFilter === 'winter') {
            filteredGames = data.games.filter(game => game.season === 'Winter');
        }

        // Collect all unique classifications across all games
        const allClassifications = new Set();
        
        const result = filteredGames.map(game => {
            let newBuildings = 0;
            let existingFacilities = 0;
            let temporaryBuildings = 0;
            let unknown = 0;

            game.features.forEach(feature => {
                const props = feature.properties;

                // Collect unique classifications
                if (props.classification) {
                    allClassifications.add(props.classification);
                }

                if (props.classification) {
                    const classification = props.classification.toLowerCase();
                    if (classification.includes('temporary')) {
                        temporaryBuildings++;
                    } else if (classification.includes('new')) {
                        newBuildings++;
                    } else if (classification.includes('existing')) {
                        existingFacilities++;
                    } else {
                        console.log(`Unknown classification: "${props.classification}" in ${game.year} ${game.location}`);
                        unknown++;
                    }
                } else if (props.opened) {
                    const openedYear = parseInt(props.opened.match(/(\d{4})/)?.[1]) || game.year;
                    if (Math.abs(openedYear - game.year) <= 2) {
                        newBuildings++;
                    } else {
                        existingFacilities++;
                    }
                } else {
                    console.log(`No classification/opened data for venue in ${game.year} ${game.location}; classification: ${props.classification}`);
                    unknown++;
                }
            });

            return {
                year: game.year,
                'New Buildings': newBuildings,
                'Existing Facilities': existingFacilities,
                'Temporary Buildings': temporaryBuildings,
                'Unknown': unknown
            };
        }).sort((a, b) => a.year - b.year);

        // Fill missing years with zero values to ensure proper x-axis positioning
        const filledResult = [];
        const minYear = Math.min(...result.map(g => g.year));
        const maxYear = Math.max(...result.map(g => g.year));
        const gamesByYear = {};
        
        // Index existing data by year
        result.forEach(game => {
            gamesByYear[game.year] = game;
        });
        
        // Create entry for every 4 years (Olympic cycle) to ensure proper spacing
        for (let year = minYear; year <= maxYear; year += 4) {
            if (gamesByYear[year]) {
                filledResult.push(gamesByYear[year]);
            } else {
                filledResult.push({
                    year: year,
                    'New Buildings': 0,
                    'Existing Facilities': 0,
                    'Temporary Buildings': 0,
                    'Unknown': 0
                });
            }
        }

        console.log('getNewVsExistingData result:', filledResult.length, 'games');
        console.log('Year range:', result[0]?.year, 'to', result[result.length - 1]?.year);
        console.log('Sample recent games:', result.slice(-5).map(g => ({
            year: g.year,
            new: g['New Buildings'],
            existing: g['Existing Facilities'],
            temporary: g['Temporary Buildings'],
            unknown: g['Unknown']
        })));
        console.log('All unique classifications found:', Array.from(allClassifications).sort());

        // Apply classification filter
        if (classificationFilter !== 'all') {
            return filledResult.map(game => ({
                ...game,
                'New Buildings': classificationFilter === 'new' ? game['New Buildings'] : 0,
                'Existing Facilities': classificationFilter === 'existing' ? game['Existing Facilities'] : 0,
                'Temporary Buildings': classificationFilter === 'temporary' ? game['Temporary Buildings'] : 0,
                'Unknown': classificationFilter === 'unknown' ? game['Unknown'] : 0
            }));
        }

        return filledResult;
    };

    // Process data for Reuse status Sankey diagram
    const getSankeyData = () => {
        if (!data?.games) return {nodes: [], links: []};

        const olympicToStatus = {};

        // Group by decades
        data.games.forEach(game => {
            const decade = Math.floor(game.year / 10) * 10 + 's';
            if (!olympicToStatus[decade]) {
                olympicToStatus[decade] = {};
            }

            game.features.forEach(feature => {
                const status = feature.properties.status || 'Unknown';
                const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

                if (!olympicToStatus[decade][normalizedStatus]) {
                    olympicToStatus[decade][normalizedStatus] = 0;
                }
                olympicToStatus[decade][normalizedStatus]++;
            });
        });

        // Create nodes and links
        const nodes = [];
        const links = [];

        // Add decade nodes
        Object.keys(olympicToStatus).forEach(decade => {
            nodes.push({id: decade});
        });

        // Add status nodes
        const allStatuses = new Set();
        Object.values(olympicToStatus).forEach(statuses => {
            Object.keys(statuses).forEach(status => allStatuses.add(status));
        });

        allStatuses.forEach(status => {
            nodes.push({id: status});
        });

        // Add links
        Object.entries(olympicToStatus).forEach(([decade, statuses]) => {
            Object.entries(statuses).forEach(([status, count]) => {
                if (count > 0) {
                    links.push({
                        source: decade,
                        target: status,
                        value: count
                    });
                }
            });
        });

        return {nodes, links};
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

    return (
        <div className="space-y-8">
            {/* Section Header */}
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
                        Analysis of Olympic venue development patterns over time, infrastructure evolution, and
                        historical trends
                    </p>
                </div>
            </div>

            {/* Number of venues per Olympic Games */}
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                        📊 Number of venues per Olympic Games
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                          Scatter Plot
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">View by:</span>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('season')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    viewMode === 'season'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Season
                            </button>
                            <button
                                onClick={() => setViewMode('venue-type')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    viewMode === 'venue-type'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Venue Type
                            </button>
                        </div>
                    </div>
                </div>

                {/* Season Filter */}
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
                            Both Seasons
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
                <div className="h-80 chart-container">
                    <style jsx>{`
                        .chart-container :global(text) {
                            fill: #d1d5db !important;
                            font-weight: 600 !important;
                        }
                    `}</style>
                    <ResponsiveScatterPlot
                        data={getVenuesPerGameData()}
                        margin={{top: 20, right: 30, bottom: 50, left: 60}}
                        xScale={{type: 'linear', min: 'auto', max: 'auto'}}
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
                        colors={getScatterColors()}
                        nodeSize={8}
                        useMesh={true}
                        tooltip={({node}) => (
                            <div
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80 max-w-96">
                                <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {node.data.location} {node.data.x}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    {node.data.season} Olympics
                                </div>
                                <div className="space-y-2">
                                    {viewMode === 'season' ? (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Total Venues:</span>
                                                <span className="text-gray-900 dark:text-gray-100">{node.data.y}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span
                                                    className="font-medium text-gray-700 dark:text-gray-300">Sports:</span>
                                                <span
                                                    className="text-gray-900 dark:text-gray-100">{node.data.sportsCount}</span>
                                            </div>
                                            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Venue
                                                    Types:
                                                </div>
                                                <div
                                                    className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {node.data.venueTypes}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Venue Type:</span>
                                                <span
                                                    className="text-gray-900 dark:text-gray-100">{node.data.venueType}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span
                                                    className="font-medium text-gray-700 dark:text-gray-300">Count:</span>
                                                <span className="text-gray-900 dark:text-gray-100">{node.data.y}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">Total Sports:</span>
                                                <span
                                                    className="text-gray-900 dark:text-gray-100">{node.data.sportsCount}</span>
                                            </div>
                                        </>
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
                            }
                        }}
                    />
                </div>

                {/* Custom Legend */}
                <div className="flex justify-center mt-2 flex-wrap gap-4">
                    {getVenuesPerGameData().map((series, index) => (
                        <div key={series.id} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{backgroundColor: getScatterColors()[index]}}
                            ></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {series.id}
                          </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ratio of new buildings to existing facilities over time */}
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
                    🏗️ Ratio of new buildings to existing facilities over time
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Bar Chart
                  </span>
                </h3>
                
                {/* Season Filter */}
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
                            Both Seasons
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
                
                {/* Classification Filter */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Classification Filter
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setClassificationFilter('all')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                classificationFilter === 'all'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            All Classifications
                        </button>
                        <button
                            onClick={() => setClassificationFilter('new')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                classificationFilter === 'new'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            New Buildings
                        </button>
                        <button
                            onClick={() => setClassificationFilter('existing')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                classificationFilter === 'existing'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Existing Facilities
                        </button>
                        <button
                            onClick={() => setClassificationFilter('temporary')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                classificationFilter === 'temporary'
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Temporary Buildings
                        </button>
                        <button
                            onClick={() => setClassificationFilter('unknown')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                classificationFilter === 'unknown'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Unknown
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
                    <ResponsiveBar
                        data={getNewVsExistingData()}
                        keys={['New Buildings', 'Existing Facilities', 'Temporary Buildings', 'Unknown']}
                        indexBy="year"
                        margin={{top: 20, right: 30, bottom: 80, left: 60}}
                        padding={0.1}
                        valueScale={{type: 'linear'}}
                        indexScale={{type: 'band', round: true}}
                        minValue={0}
                        colors={['#10b981', '#3b82f6', '#f59e0b', '#6b7280']}
                        groupMode="stacked"
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            orient: 'bottom',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: -45,
                            tickValues: 'every 4 years'
                        }}
                        axisLeft={{
                            orient: 'left',
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0
                        }}
                        enableGridX={false}
                        enableGridY={true}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{
                            from: 'color',
                            modifiers: [['darker', 1.6]]
                        }}
                        legends={[]}
                        theme={{
                            background: 'transparent',
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
                                    fontSize: 11,
                                    fill: '#d1d5db',
                                    fontWeight: 600
                                }
                            }
                        }}
                    />
                </div>

                {/* Custom Legend */}
                <div className="flex justify-center mt-2 flex-wrap gap-4">
                    {['New Buildings', 'Existing Facilities', 'Temporary Buildings', 'Unknown'].map((key, index) => {
                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'];
                        return (
                            <div key={key} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3"
                                    style={{backgroundColor: colors[index]}}
                                ></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                  {key}
                              </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Reuse status of Olympic venues over time */}
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
                    🔄 Reuse status of Olympic venues over time
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Sankey Diagram
                  </span>
                </h3>
                <div className="h-80 chart-container">
                    <style jsx>{`
                        .chart-container :global(text) {
                            fill: #d1d5db !important;
                            font-weight: 600 !important;
                        }
                    `}</style>
                    {getSankeyData().links.length > 0 ? (
                        <ResponsiveSankey
                            data={getSankeyData()}
                            margin={{top: 40, right: 200, bottom: 40, left: 60}}
                            align="justify"
                            colors={['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5', '#ffc658', '#ff7c7c', '#d084a0', '#8dd3c7']}
                            nodeOpacity={1}
                            nodeHoverOthersOpacity={0.5}
                            nodeThickness={16}
                            nodeSpacing={32}
                            nodeBorderWidth={1}
                            nodeBorderColor={{
                                from: 'color',
                                modifiers: [['darker', 0.3]]
                            }}
                            linkOpacity={0.9}
                            linkHoverOthersOpacity={0.3}
                            linkContract={0}
                            enableLinkGradient={true}
                            linkBlendMode="normal"
                            labelPosition="outside"
                            labelOrientation="horizontal"
                            labelPadding={16}
                            labelTextColor="#d1d5db"
                            theme={{
                                background: 'transparent',
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
                                }
                            }}
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400">No reuse data available</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default TemporalDevelopmentAnalyses;