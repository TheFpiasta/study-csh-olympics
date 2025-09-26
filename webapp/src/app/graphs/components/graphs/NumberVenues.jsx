import {olympicColors as oc} from "@/components/utility";
import React, {useState} from "react";
import {ResponsiveScatterPlot} from "@nivo/scatterplot";
import {getYearRange} from "@/app/graphs/components/utility";
import SectionGraphHeadline from "@/app/graphs/components/templates/SectionGraphHeadline";

const NumberVenues = ({data}) => {
    const [viewMode, setViewMode] = useState('season'); // 'season' or 'venue-type'
    const [scatterSeasonFilter, setScatterSeasonFilter] = useState('both');

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

    // Process data for Number of venues per Olympic Games (Scatter plot)
    const getVenuesPerGameData = () => {
        if (!data?.games) return [];

        if (viewMode === 'season') {
            return getSeasonData();
        } else {
            return getVenueTypeData();
        }
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

    return (
        <div
            className="mx-4 mb-8 bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
            <SectionGraphHeadline headline="Venues Count & Venues Types"
                                  description="Expplore the number of venues used in each Olympic Games and find out, which types of venues were most common."
                                  infoText=""
            >
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
            </SectionGraphHeadline>

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
                        tickRotation: 0,
                        legend: 'Year',
                        legendPosition: 'middle',
                        legendOffset: 40,
                    }}
                    axisLeft={{
                        orient: 'left',
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Count',
                        legendPosition: 'middle',
                        legendOffset: -40,
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
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Total
                                                Venues:</span>
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
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Venue
                                                Type:</span>
                                            <span
                                                className="text-gray-900 dark:text-gray-100">{node.data.venueType}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span
                                                className="font-medium text-gray-700 dark:text-gray-300">Count:</span>
                                            <span className="text-gray-900 dark:text-gray-100">{node.data.y}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Total
                                                Sports:</span>
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
    );
}

export default NumberVenues;
