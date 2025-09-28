import {ResponsiveBar} from "@nivo/bar";
import React, {useState} from "react";
import {getYearRange, graphTheme} from "@/app/graphs/components/utility";
import {olympicColors as oc} from "@/components/utility";
import SectionGraphHeadline from "@/app/graphs/components/templates/SectionGraphHeadline";

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
                // Track if this game contributes any venues after filtering
                let hasValidFeatures = false;
                let gameVenueCount = 0;

                // Count venues by build state for this year
                game.features.forEach(feature => {
                    // Apply season filter
                    if (buildStateSeasonFilter === 'summer' && feature.properties.season !== 'Summer') return;
                    if (buildStateSeasonFilter === 'winter' && feature.properties.season !== 'Winter') return;

                    hasValidFeatures = true;
                    gameVenueCount++;

                    const classification = feature.properties.classification || 'Unknown';
                    // if (classification === 'Unknown') logger.warn(`Feature with unknown classification in ${game.location} ${year} name: ${feature.properties.associated_names}`);
                    if (yearData[year][classification] !== undefined) {
                        yearData[year][classification]++;
                    } else {
                        // Handle any unexpected classification values
                        yearData[year]['Unknown']++;
                    }
                });

                // Only update location if this game has valid features after filtering
                if (hasValidFeatures) {
                    if (yearData[year].location === '') {
                        // First valid game for this year
                        yearData[year].location = game.location;
                    } else if (yearData[year].location !== game.location) {
                        // Multiple games in same year - combine locations
                        yearData[year].location = `${yearData[year].location} / ${game.location}`;
                    }
                }
            }
        });

        return Object.values(yearData).sort((a, b) => a.year - b.year);
    };

    return (
        <div
            className="p-6 mx-4 mb-8 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
            <SectionGraphHeadline headline="Construction Status Over Time"
                                  description="Analyze the construction status of Olympic venues over time. Use the filters to focus on specific seasons and construction state categories."
                                  infoText="The construction status was determined based at the time of host selection. The unknowen status are created by our prove of concept data matching. On empty years, in the data time range, no Olympics were held."
            >
            </SectionGraphHeadline>

            {/* Season Filter for Build State Chart */}
            <div className="p-4 mb-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
            <div className="p-4 mb-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
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
                        },
                        legend: 'Year',
                        legendPosition: 'middle',
                        legendOffset: 40,
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Count',
                        legendPosition: 'middle',
                        legendOffset: -40,
                    }}
                    tooltip={({id, value, color, data}) => (
                        <div
                            className="p-4 bg-white border border-gray-200 rounded-lg shadow-xl dark:bg-gray-800 dark:border-gray-600 min-w-60">
                            <div className="mb-1 text-base font-bold text-gray-900 dark:text-gray-100">
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
                            <div className="pt-2 text-sm border-t border-gray-200 dark:border-gray-600">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>New build: {data['New build']}</div>
                                    <div>Existing: {data['Existing']}</div>
                                    <div>Temporary: {data['Temporary']}</div>
                                    <div>Unknown: {data['Unknown']}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    theme={graphTheme}
                />
            </div>

            {/* Build State Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
                {['New build', 'Existing', 'Temporary', 'Unknown'].filter(classification => barBuildStateFilter.includes(classification)).map((classification, index) => {
                    const originalIndex = ['New build', 'Existing', 'Temporary', 'Unknown'].indexOf(classification);
                    return (
                        <div key={classification} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3"
                                style={{backgroundColor: ['#EE334E', '#00A651', '#FCB131', '#0081C8'][originalIndex]}}
                            ></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
