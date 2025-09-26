import {ResponsiveBar} from "@nivo/bar";
import {useState} from "react";
import {getYearRange} from "@/app/graphs/components/utility";
import {olympicColors as oc} from "@/components/utility";

const BuildStateTime = ({data}) => {
    const [buildStateSeasonFilter, setBuildStateSeasonFilter] = useState('both');
    const [barBuildStateFilter, setBarBuildStateFilter] = useState(['New build', 'Existing', 'Temporary', 'Unknown']);

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
                    // if (classification === 'Unknown') logger.warn(`Feature with unknown classification in ${game.location} ${year} name: ${feature.properties.associated_names}`);
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

    return (
        <div
            className="mx-4 mb-8 bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
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
    );
}

export default BuildStateTime;
