'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import LoadingSpinner from '../../../components/LoadingSpinner';
import logger from '@/components/logger';

const ContinentalVenuesBarChart = ({ geojsonData }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayMode, setDisplayMode] = useState('count'); // 'count' or 'percentage'
    const [visibleCategories, setVisibleCategories] = useState({
        'Still Active': true,
        'Repurposed': true,
        'Demolished': true,
        'Abandoned': true,
        'Temporary': true,
        'Unknown Status': true
    });

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);
    }, [geojsonData]);

    // Helper function to determine continent from location
    const getContinent = (location) => {
        if (!location) return 'Unknown';
        
        const locationLower = location.toLowerCase();
        
        // European countries and cities
        if (locationLower.includes('london') || locationLower.includes('paris') || 
            locationLower.includes('berlin') || locationLower.includes('munich') || 
            locationLower.includes('rome') || locationLower.includes('barcelona') || 
            locationLower.includes('amsterdam') || locationLower.includes('stockholm') || 
            locationLower.includes('helsinki') || locationLower.includes('antwerp') ||
            locationLower.includes('innsbruck') || locationLower.includes('grenoble') ||
            locationLower.includes('sarajevo') || locationLower.includes('albertville') ||
            locationLower.includes('lillehammer') || locationLower.includes('turin') ||
            locationLower.includes('sochi') || locationLower.includes('st. moritz') ||
            locationLower.includes('cortina') || locationLower.includes('oslo') ||
            locationLower.includes('garmisch') || locationLower.includes('chamonix')) {
            return 'Europe';
        }
        
        // North American countries and cities
        if (locationLower.includes('los angeles') || locationLower.includes('atlanta') ||
            locationLower.includes('lake placid') || locationLower.includes('squaw valley') ||
            locationLower.includes('calgary') || locationLower.includes('vancouver') ||
            locationLower.includes('salt lake') || locationLower.includes('montreal') ||
            locationLower.includes('st. louis') || locationLower.includes('mexico city')) {
            return 'North America';
        }
        
        // Asian countries and cities
        if (locationLower.includes('tokyo') || locationLower.includes('seoul') ||
            locationLower.includes('beijing') || locationLower.includes('nagano') ||
            locationLower.includes('sapporo') || locationLower.includes('pyeongchang')) {
            return 'Asia';
        }
        
        // Oceanian countries and cities
        if (locationLower.includes('melbourne') || locationLower.includes('sydney')) {
            return 'Oceania';
        }
        
        // South American countries and cities
        if (locationLower.includes('rio')) {
            return 'South America';
        }
        
        // African countries and cities (none yet, but prepared)
        
        return 'Unknown';
    };

    // Helper function to categorize venue status/use
    const getVenueUseCategory = (feature) => {
        const status = feature.properties?.status?.toLowerCase() || '';
        const classification = feature.properties?.classification?.toLowerCase() || '';
        
        // Check if venue is still active/in use
        if (status.includes('active') || status.includes('operational') || 
            status.includes('in use') || status.includes('open')) {
            return 'Still Active';
        }
        
        // Check if venue was demolished/destroyed
        if (status.includes('demolished') || status.includes('destroyed') || 
            status.includes('dismantled') || status.includes('removed')) {
            return 'Demolished';
        }
        
        // Check if venue was converted/repurposed
        if (status.includes('converted') || status.includes('repurposed') || 
            status.includes('renovated') || status.includes('transformed')) {
            return 'Repurposed';
        }
        
        // Check if venue is abandoned/unused
        if (status.includes('abandoned') || status.includes('unused') || 
            status.includes('closed') || status.includes('derelict')) {
            return 'Abandoned';
        }
        
        // Check for temporary venues
        if (classification.includes('temporary') || status.includes('temporary')) {
            return 'Temporary';
        }
        
        return 'Unknown Status';
    };

    // Process data for continental venue comparison
    const getBarData = () => {
        if (!data?.games) return [];

        const continentData = {};
        
        // Initialize continent data structure
        const continents = ['Europe', 'North America', 'Asia', 'Oceania', 'South America'];
        const useCategories = ['Still Active', 'Repurposed', 'Demolished', 'Abandoned', 'Temporary', 'Unknown Status'];
        
        continents.forEach(continent => {
            continentData[continent] = {
                continent,
                total: 0
            };
            useCategories.forEach(category => {
                continentData[continent][category] = 0;
            });
        });

        // Process all venues
        data.games.forEach(game => {
            const continent = getContinent(game.location);
            
            if (continent !== 'Unknown' && continentData[continent]) {
                game.features?.forEach(feature => {
                    const useCategory = getVenueUseCategory(feature);
                    
                    continentData[continent].total++;
                    continentData[continent][useCategory]++;
                });
            }
        });

        // Convert to array and filter out continents with no data
        let result = continents
            .map(continent => continentData[continent])
            .filter(item => item.total > 0);

        // Apply percentage calculation if needed
        if (displayMode === 'percentage') {
            result = result.map(continent => {
                const percentageContinent = { ...continent };
                useCategories.forEach(category => {
                    percentageContinent[category] = continent.total > 0 
                        ? Math.round((continent[category] / continent.total) * 100 * 10) / 10
                        : 0;
                });
                return percentageContinent;
            });
        }

        console.log('Continental venue data:', result);
        
        return result;
    };

    // Get data for display
    const barData = getBarData();

    if (loading) {
        return (
            <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
                <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                    🌍 Continental Olympic Venue Legacy Analysis
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Bar Chart
                    </span>
                </h3>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
                <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                    🌍 Continental Olympic Venue Legacy Analysis
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Bar Chart
                    </span>
                </h3>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="mb-4 text-6xl text-red-500">⚠️</div>
                        <p className="text-red-600 dark:text-red-400">Error loading data: {error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const useCategories = ['Still Active', 'Repurposed', 'Demolished', 'Abandoned', 'Temporary', 'Unknown Status'];
    const categoryColors = {
        'Still Active': '#22c55e',      // Green
        'Repurposed': '#3b82f6',       // Blue  
        'Demolished': '#ef4444',       // Red
        'Abandoned': '#f59e0b',        // Amber
        'Temporary': '#8b5cf6',        // Purple
        'Unknown Status': '#6b7280'    // Gray
    };
    
    // Filter categories based on visibility
    const visibleCategoryList = useCategories.filter(category => visibleCategories[category]);
    
    // Create color array in the same order as visible categories
    const colorArray = visibleCategoryList.map(category => categoryColors[category]);
    
    // Toggle category visibility
    const toggleCategory = (category) => {
        setVisibleCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    return (
        <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
            <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                🌍 Continental Olympic Venue Legacy Analysis
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    Bar Chart
                </span>
            </h3>
            
            {/* Display Mode Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Display Mode:</span>
                        <div className="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-700">
                            <button
                                onClick={() => setDisplayMode('count')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    displayMode === 'count'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Absolute Count
                            </button>
                            <button
                                onClick={() => setDisplayMode('percentage')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    displayMode === 'percentage'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Percentage
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {displayMode === 'count' 
                            ? 'Total number of venues in each category'
                            : 'Percentage distribution within each continent'
                        }
                    </p>
                </div>
            </div>
            
            {/* Custom Legend */}
            <div className="mb-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Venue Status Categories (click to toggle)</h4>
                <div className="flex flex-wrap gap-2">
                    {useCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                visibleCategories[category]
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-2 border-gray-300 dark:border-gray-600 opacity-50'
                            }`}
                            style={{ 
                                borderColor: visibleCategories[category] ? categoryColors[category] : undefined 
                            }}
                        >
                            <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: categoryColors[category] }}
                            />
                            {category}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="mt-6">
                <div className="h-96 md:h-[500px]">
                    <ResponsiveBar
                        data={barData}
                        keys={visibleCategoryList}
                        indexBy="continent"
                        margin={{ top: 50, right: 30, bottom: 50, left: 60 }}
                        padding={0.3}
                        valueScale={{ type: displayMode === 'percentage' ? 'linear' : 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={colorArray}
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
                            legend: 'Continent',
                            legendPosition: 'middle',
                            legendOffset: 32
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: displayMode === 'percentage' ? 'Venues (%)' : 'Number of Venues',
                            legendPosition: 'middle',
                            legendOffset: -40
                        }}
                        enableLabel={true}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        labelTextColor={{
                            from: 'color',
                            modifiers: [['darker', 1.6]]
                        }}
                        legends={[]}
                        theme={{
                            background: 'transparent',
                            text: {
                                fontSize: 12,
                                fill: '#fff',
                                fontWeight: 600,
                                outlineWidth: 0,
                                outlineColor: 'transparent'
                            },
                            axis: {
                                legend: { 
                                    text: { 
                                        fill: '#fff', 
                                        fontSize: 14, 
                                        fontWeight: 600 
                                    } 
                                },
                                ticks: { 
                                    text: { 
                                        fill: '#fff', 
                                        fontSize: 11 
                                    }, 
                                    line: { 
                                        stroke: '#444' 
                                    } 
                                }
                            },
                            grid: {
                                line: {
                                    stroke: '#444',
                                    strokeWidth: 1
                                }
                            },
                            tooltip: {
                                container: { 
                                    background: '#0f1724', 
                                    color: '#fff' 
                                }
                            }
                        }}
                        tooltip={({ id, value, color, data }) => (
                            <div className="p-3 text-white bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
                                <div className="mb-2 font-bold">{data.continent}</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-sm text-gray-300">{id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Venues:</span>
                                    <span>{value}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Total:</span>
                                    <span>{data.total}</span>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Venue Status Info Cards */}
            <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h4 className="font-semibold text-green-700 dark:text-green-300">Still Active</h4>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                        Venues continuing to serve their original or similar purpose after the Olympics.
                    </p>
                </div>
                
                <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">Repurposed</h4>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        Venues converted or renovated for different uses, demonstrating adaptive reuse.
                    </p>
                </div>
                
                <div className="p-4 border rounded-lg border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 dark:border-amber-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300">Continental Patterns</h4>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                        Different continents show varying patterns of venue legacy and long-term usage strategies.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContinentalVenuesBarChart;