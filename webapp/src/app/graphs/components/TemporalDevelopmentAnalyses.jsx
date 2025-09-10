'use client';

import React, {useState, useEffect} from 'react';
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import {ResponsiveBar} from '@nivo/bar';
import LoadingSpinner from '../../../components/LoadingSpinner';
import {getYearRange} from "@/app/graphs/components/utility";
import {olympicColors as oc} from "@/components/utility";
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import ShowError from "@/app/graphs/components/templates/ShowError";
import ShowNoData from "@/app/graphs/components/templates/ShowNoData";

const TemporalDevelopmentAnalyses = ({geojsonData}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scatterSeasonFilter, setScatterSeasonFilter] = useState('both');
    const [barSeasonFilter, setBarSeasonFilter] = useState('both');
    const [buildStateSeasonFilter, setBuildStateSeasonFilter] = useState('both');
    const [scatterBuildStateSeasonFilter, setScatterBuildStateSeasonFilter] = useState('both');
    const [buildStateFilter, setBuildStateFilter] = useState(['New build', 'Existing', 'Temporary', 'Unknown']);
    const [barBuildStateFilter, setBarBuildStateFilter] = useState(['New build', 'Existing', 'Temporary', 'Unknown']);
    const [viewMode, setViewMode] = useState('season'); // 'season' or 'venue-type'
    const [classificationFilter, setClassificationFilter] = useState('all');

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);
    }, [geojsonData]);

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

    // Data grouped by venue type
    const getVenueTypeData = () => {
        const result = [];

        // Get all unique venue types first from all features
        const allVenueTypes = new Set();
        data.games.forEach(game => {
            game.features.forEach(feature => {
                // Apply season filter at feature level
                if (scatterSeasonFilter === 'summer' && feature.properties.season !== 'Summer') return;
                if (scatterSeasonFilter === 'winter' && feature.properties.season !== 'Winter') return;

                const type = feature.properties.type || 'Unknown';
                allVenueTypes.add(type);
            });
        });

        // Create series for each venue type
        const colors = [oc.primary.blue, oc.primary.yellow, oc.primary.green, oc.primary.red];
        let colorIndex = 0;

        allVenueTypes.forEach(venueType => {
            const typeData = data.games.map(game => {
                // Count venues of this type in this game, applying season filter
                const filteredFeatures = game.features.filter(feature => {
                    // Apply season filter at feature level
                    if (scatterSeasonFilter === 'summer' && feature.properties.season !== 'Summer') return false;
                    if (scatterSeasonFilter === 'winter' && feature.properties.season !== 'Winter') return false;

                    return (feature.properties.type || 'Unknown') === venueType;
                });

                const count = filteredFeatures.length;

                const allSports = new Set();
                filteredFeatures.forEach(feature => {
                    if (feature.properties.sports) {
                        const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                        sports.forEach(sport => allSports.add(sport));
                    }
                });

                // Determine the predominant season for this data point
                const seasonCounts = {Summer: 0, Winter: 0};
                filteredFeatures.forEach(feature => {
                    seasonCounts[feature.properties.season] = (seasonCounts[feature.properties.season] || 0) + 1;
                });
                const predominantSeason = seasonCounts.Summer >= seasonCounts.Winter ? 'Summer' : 'Winter';

                return {
                    x: game.year,
                    y: count,
                    location: game.location,
                    season: predominantSeason,
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

    // Process data for Build State Analysis (Stacked Bar Chart)
    const getBuildStateData = () => {
        if (!data?.games) return [];

        // Get year range and initialize all years
        const yearRange = getYearRange(data);
        const yearData = {};

        // Initialize all years from min to max with zero data
        for (let year = yearRange.min; year <= yearRange.max; year++) {
            yearData[year] = {
                year: year,
                location: '',
                'New build': 0,
                'Existing': 0,
                'Temporary': 0,
                'Unknown': 0
            };
        }

        // Fill in actual data for Olympic years
        data.games.forEach(game => {
            const year = parseInt(game.year);

            if (yearData[year]) {
                yearData[year].location = game.location;

                // Count venues by build state for this year
                game.features.forEach(feature => {
                    // Apply season filter
                    if (buildStateSeasonFilter === 'summer' && feature.properties.season !== 'Summer') return;
                    if (buildStateSeasonFilter === 'winter' && feature.properties.season !== 'Winter') return;

                    const classification = feature.properties.classification || 'Unknown';
                    // if (classification === 'Unknown') console.warn(`Feature with unknown classification in ${game.location} ${year} name: ${feature.properties.associated_names}`);
                    if (yearData[year][classification] !== undefined) {
                        yearData[year][classification]++;
                    } else {
                        // Handle any unexpected classification values
                        yearData[year]['Unknown']++;
                    }
                });
            }
        });

        return Object.values(yearData).sort((a, b) => a.year - b.year);
    };

    // Process data for Build State Scatter Plot
    const getBuildStateScatterData = () => {
        if (!data?.games) return [];

        const result = [];
        const buildStates = ['New build', 'Existing', 'Temporary', 'Unknown'];
        const colors = [oc.primary.blue, oc.primary.yellow, oc.primary.green, oc.primary.red];

        buildStates.forEach((buildState, index) => {
            // Only include this build state if it's selected in the filter
            if (!buildStateFilter.includes(buildState)) return;

            const seriesData = [];

            data.games.forEach(game => {
                const year = parseInt(game.year);
                let count = 0;
                const venues = [];

                // Count venues by build state for this year and collect venue details
                game.features.forEach(feature => {
                    // Apply season filter
                    if (scatterBuildStateSeasonFilter === 'summer' && feature.properties.season !== 'Summer') return;
                    if (scatterBuildStateSeasonFilter === 'winter' && feature.properties.season !== 'Winter') return;

                    const classification = feature.properties.classification || 'Unknown';
                    if (classification === buildState) {
                        count++;
                        venues.push({
                            name: feature.properties.associated_names?.[0] || 'Unknown venue',
                            sports: feature.properties.sports || [],
                            capacity: feature.properties.seating_capacity,
                            type: feature.properties.type,
                            status: feature.properties.status,
                            location: feature.properties.location,
                            opened: feature.properties.opened
                        });
                    }
                });

                // Only add data point if there are venues of this build state
                if (count > 0) {
                    // Calculate totals and aggregations
                    const totalCapacity = venues.reduce((sum, venue) => {
                        const capacity = parseInt(venue.capacity) || 0;
                        return sum + capacity;
                    }, 0);

                    const allSports = new Set();
                    venues.forEach(venue => {
                        const sports = Array.isArray(venue.sports) ? venue.sports : [venue.sports];
                        sports.forEach(sport => sport && allSports.add(sport));
                    });

                    const venueTypes = {};
                    venues.forEach(venue => {
                        const type = venue.type || 'Unknown';
                        venueTypes[type] = (venueTypes[type] || 0) + 1;
                    });

                    const statusCounts = {};
                    venues.forEach(venue => {
                        const status = venue.status || 'Unknown';
                        statusCounts[status] = (statusCounts[status] || 0) + 1;
                    });

                    seriesData.push({
                        x: year,
                        y: count,
                        location: game.location,
                        buildState: buildState,
                        venues: venues,
                        totalCapacity: totalCapacity,
                        sportsCount: allSports.size,
                        venueTypes: Object.entries(venueTypes).map(([type, count]) => `${type}: ${count}`).join(', '),
                        statusBreakdown: Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(', ')
                    });
                }
            });

            if (seriesData.length > 0) {
                result.push({
                    id: buildState,
                    data: seriesData,
                    color: colors[index]
                });
            }
        });

        return result;
    };

    // Toggle build state filter
    const toggleBuildStateFilter = (buildState) => {
        setBuildStateFilter(prev => {
            if (prev.includes(buildState)) {
                return prev.filter(state => state !== buildState);
            } else {
                return [...prev, buildState];
            }
        });
    };

    // Toggle bar build state filter
    const toggleBarBuildStateFilter = (buildState) => {
        setBarBuildStateFilter(prev => {
            if (prev.includes(buildState)) {
                return prev.filter(state => state !== buildState);
            } else {
                return [...prev, buildState];
            }
        });
    };

    // Get colors for scatter plot based on current view mode and filter
    const getScatterColors = () => {
        if (viewMode === 'venue-type') {
            const data = getVenueTypeData();
            return data.map(series => series.color);
        } else {
            // Season mode
            if (scatterSeasonFilter === 'summer') return ['#f59e0b'];
            if (scatterSeasonFilter === 'winter') return ['#06b6d4'];
            return ['#f59e0b', '#06b6d4']; // both
        }
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

            <SectionHeader headline={"⏳ Temporal development analyses"}
                           description={"Analysis of Olympic venue development patterns over time, infrastructure evolution, and historical trends"}
            />

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

                {/* Season Filter for Scatter Plot */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Olympic Season
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setScatterSeasonFilter('both')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                scatterSeasonFilter === 'both'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Both Seasons
                        </button>
                        <button
                            onClick={() => setScatterSeasonFilter('summer')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                scatterSeasonFilter === 'summer'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Summer
                        </button>
                        <button
                            onClick={() => setScatterSeasonFilter('winter')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                scatterSeasonFilter === 'winter'
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
                        xScale={{type: 'linear', min: getYearRange(data).min, max: getYearRange(data).max}}
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
                            grid: {
                                line: {
                                    stroke: oc.extended.black3,
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

            {/* Build State Analysis */}
            <div
                className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                        🏗️ Ratio of new buildings to existing facilities over time
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                          Stacked Bar Chart
                      </span>
                    </h3>
                </div>

                {/* Season Filter for Build State Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Olympic Season
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setBuildStateSeasonFilter('both')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                buildStateSeasonFilter === 'both'
                                    ? 'bg-violet-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Both Seasons
                        </button>
                        <button
                            onClick={() => setBuildStateSeasonFilter('summer')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                buildStateSeasonFilter === 'summer'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Summer
                        </button>
                        <button
                            onClick={() => setBuildStateSeasonFilter('winter')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                buildStateSeasonFilter === 'winter'
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            Winter
                        </button>
                    </div>
                </div>

                {/* Build State Filter for Stacked Bar Chart */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Build State Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {['New build', 'Existing', 'Temporary', 'Unknown'].map((buildState, index) => (
                            <button
                                key={buildState}
                                onClick={() => toggleBarBuildStateFilter(buildState)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-2 ${
                                    barBuildStateFilter.includes(buildState)
                                        ? 'text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                                style={{
                                    backgroundColor: barBuildStateFilter.includes(buildState)
                                        ? ['#EE334Eaa', '#00A651aa', '#FCB131aa', '#0081C8aa'][index]
                                        : undefined
                                }}
                            >
                                <div
                                    className="w-2 h-2 rounded-full"
                                    style={{backgroundColor: ['#EE334E', '#00A651', '#FCB131', '#0081C8'][index]}}
                                ></div>
                                {buildState}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-80 chart-container">
                    <style jsx>{`
                        .chart-container :global(text) {
                            fill: #d1d5db !important;
                            font-weight: 600 !important;
                        }
                    `}</style>
                    <ResponsiveBar
                        data={getBuildStateData()}
                        keys={barBuildStateFilter}
                        indexBy="year"
                        margin={{top: 20, right: 30, bottom: 50, left: 60}}
                        padding={0.1}
                        valueScale={{type: 'linear'}}
                        indexScale={{type: 'band', round: true}}
                        colors={({id, data}) => {
                            // Check if this bar segment has zero value
                            if (data[id] === 0) return 'transparent';

                            // Return normal colors for non-zero values
                            const colorMap = {
                                'New build': '#EE334E',
                                'Existing': '#00A651',
                                'Temporary': '#FCB131',
                                'Unknown': '#0081C8'
                            };
                            return colorMap[id] || '#9ca3af';
                        }}
                        label={({id, value}) => value === 0 ? '' : value}
                        borderColor={{
                            from: 'color',
                            modifiers: [['darker', 1.6]]
                        }}
                        axisTop={null}
                        axisRight={null}
                        axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            format: function (value) {
                                const yearData = getBuildStateData().find(d => d.year === value);
                                const totalCount = yearData ? yearData['New build'] + yearData['Existing'] + yearData['Temporary'] + yearData['Unknown'] : 0;
                                return totalCount > 0 ? value : "";
                            }
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0
                        }}
                        tooltip={({id, value, color, data}) => (
                            <div
                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-60">
                                <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                    {data.location} {data.year}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{backgroundColor: color}}
                                    ></div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{id}:</span>
                                    <span className="text-gray-900 dark:text-gray-100">{value} venues</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>New build: {data['New build']}</div>
                                        <div>Existing: {data['Existing']}</div>
                                        <div>Temporary: {data['Temporary']}</div>
                                        <div>Unknown: {data['Unknown']}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        theme={{
                            background: 'transparent',
                            grid: {
                                line: {
                                    stroke: oc.extended.black3,
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
                            }
                        }}
                    />
                </div>

                {/* Build State Legend */}
                <div className="flex justify-center mt-2 flex-wrap gap-4">
                    {['New build', 'Existing', 'Temporary', 'Unknown'].filter(classification => barBuildStateFilter.includes(classification)).map((classification, index) => {
                        const originalIndex = ['New build', 'Existing', 'Temporary', 'Unknown'].indexOf(classification);
                        return (
                            <div key={classification} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3"
                                    style={{backgroundColor: ['#EE334E', '#00A651', '#FCB131', '#0081C8'][originalIndex]}}
                                ></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                  {classification}
                              </span>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default TemporalDevelopmentAnalyses;