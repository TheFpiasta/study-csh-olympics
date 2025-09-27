'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import LoadingSpinner from '../../../components/LoadingSpinner';

const DevelopmentStatusChart = ({ geojsonData }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayMode, setDisplayMode] = useState('count'); // 'count' or 'normalized'
    const [selectedMetric, setSelectedMetric] = useState('Games Hosted'); // Show one metric at a time
    const [visibleMetrics, setVisibleMetrics] = useState({
        'Games Hosted': true,
        'Average Athletes': true,
        'Average Cost (Billions)': true,
        'Average Revenue (Billions)': true
    });

    useEffect(() => {
        if (!geojsonData) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);
    }, [geojsonData]);

    // Country development status classification based on historical context
    const getCountryDevelopmentStatus = (location, year) => {
        if (!location) return 'Unknown';
        
        const locationLower = location.toLowerCase();
        const gameYear = parseInt(year) || new Date().getFullYear();
        
        // Industrialized/Developed countries (generally OECD countries or similar economic status)
        const industrializedCountries = [
            // North America
            'united states', 'usa', 'los angeles', 'atlanta', 'salt lake', 'lake placid', 'squaw valley',
            'canada', 'montreal', 'calgary', 'vancouver',
            
            // Western Europe
            'united kingdom', 'great britain', 'london',
            'france', 'paris', 'grenoble', 'albertville', 'chamonix',
            'germany', 'west germany', 'east germany', 'berlin', 'munich', 'garmisch',
            'italy', 'rome', 'turin', 'cortina',
            'spain', 'barcelona',
            'netherlands', 'amsterdam',
            'belgium', 'antwerp',
            'sweden', 'stockholm',
            'norway', 'oslo', 'lillehammer',
            'finland', 'helsinki',
            'switzerland', 'st. moritz',
            'austria', 'innsbruck',
            
            // Other developed countries
            'japan', 'tokyo', 'sapporo', 'nagano',
            'australia', 'melbourne', 'sydney',
            'south korea', 'seoul', 'pyeongchang'
        ];
        
        // Developing countries (based on historical economic status at time of hosting)
        const developingCountries = [
            'mexico', 'mexico city',
            'yugoslavia', 'sarajevo', // Yugoslavia in 1984 was socialist developing
            'russia', 'russian federation', 'sochi', // Post-Soviet Russia
            'china', 'beijing', // China even today is classified as developing by some metrics
            'brazil', 'rio',
            'greece', 'athens' // Greece had economic challenges, especially in recent decades
        ];
        
        // Check against industrialized countries
        for (const country of industrializedCountries) {
            if (locationLower.includes(country)) {
                return 'Industrialized';
            }
        }
        
        // Check against developing countries
        for (const country of developingCountries) {
            if (locationLower.includes(country)) {
                return 'Developing';
            }
        }
        
        // Special cases based on year
        if (locationLower.includes('russia') || locationLower.includes('soviet')) {
            return gameYear < 1991 ? 'Socialist/Planned' : 'Developing';
        }
        
        return 'Unknown';
    };

    // Helper to get value from harvard data
    const getFieldValue = (harvardObj, fieldName) => {
        if (!harvardObj || !harvardObj[fieldName] || harvardObj[fieldName].data === undefined) return 0;
        const value = parseFloat(harvardObj[fieldName].data);
        return isNaN(value) ? 0 : value;
    };

    // Process data for development status comparison
    const getBarData = () => {
        if (!data?.games) return [];

        const statusData = {
            'Industrialized': {
                status: 'Industrialized',
                'Games Hosted': 0,
                totalAthletes: 0,
                totalCost: 0,
                totalRevenue: 0,
                gameCount: 0,
                validCostGames: 0,
                validRevenueGames: 0
            },
            'Developing': {
                status: 'Developing',
                'Games Hosted': 0,
                totalAthletes: 0,
                totalCost: 0,
                totalRevenue: 0,
                gameCount: 0,
                validCostGames: 0,
                validRevenueGames: 0
            },
            'Socialist/Planned': {
                status: 'Socialist/Planned',
                'Games Hosted': 0,
                totalAthletes: 0,
                totalCost: 0,
                totalRevenue: 0,
                gameCount: 0,
                validCostGames: 0,
                validRevenueGames: 0
            }
        };

        // Process all games
        data.games.forEach(game => {
            const status = getCountryDevelopmentStatus(game.location, game.year);
            
            if (status !== 'Unknown' && statusData[status]) {
                const statusInfo = statusData[status];
                statusInfo['Games Hosted']++;
                statusInfo.gameCount++;
                
                if (game.harvard) {
                    const athletes = getFieldValue(game.harvard, 'number_of_athletes');
                    const cost = getFieldValue(game.harvard, 'cost_of_venues_(usd_2018)');
                    
                    // Calculate total revenue from all revenue sources
                    const ticketingRevenue = getFieldValue(game.harvard, 'ticketing_revenue_(usd2018)');
                    const broadcastRevenue = getFieldValue(game.harvard, 'broadcast_revenue_(usd2018)');
                    const intlSponsorshipRevenue = getFieldValue(game.harvard, 'international_sponsorship_revenue_(usd_2018)');
                    const domesticSponsorshipRevenue = getFieldValue(game.harvard, 'domestic_sponsorship_revenue_(usd_2018)');
                    
                    const revenue = ticketingRevenue + broadcastRevenue + intlSponsorshipRevenue + domesticSponsorshipRevenue;
                    
                    statusInfo.totalAthletes += athletes;
                    
                    if (cost > 0) {
                        statusInfo.totalCost += cost;
                        statusInfo.validCostGames++;
                    }
                    
                    if (revenue > 0) {
                        statusInfo.totalRevenue += revenue;
                        statusInfo.validRevenueGames++;
                    }
                }
            }
        });

        // Calculate averages and convert to appropriate units
        let result = Object.values(statusData)
            .filter(item => item['Games Hosted'] > 0)
            .map(status => {
                const avgAthletes = status.gameCount > 0 ? status.totalAthletes / status.gameCount : 0;
                const avgCost = status.validCostGames > 0 ? status.totalCost / status.validCostGames / 1000000000 : 0;
                const avgRevenue = status.validRevenueGames > 0 ? status.totalRevenue / status.validRevenueGames / 1000000000 : 0;
                
                return {
                    status: status.status,
                    'Games Hosted': status['Games Hosted'],
                    'Average Athletes': Math.round(avgAthletes),
                    'Average Cost (Billions)': Math.round(avgCost * 10) / 10,
                    'Average Revenue (Billions)': Math.round(avgRevenue * 10) / 10,
                    // Raw values for normalization
                    _rawAthletes: avgAthletes,
                    _rawCost: avgCost,
                    _rawRevenue: avgRevenue,
                    _rawGames: status['Games Hosted']
                };
            });

        // Apply normalization if needed
        if (displayMode === 'normalized') {
            const maxValues = {
                games: Math.max(...result.map(r => r._rawGames)),
                athletes: Math.max(...result.map(r => r._rawAthletes)),
                cost: Math.max(...result.map(r => r._rawCost)),
                revenue: Math.max(...result.map(r => r._rawRevenue))
            };
            
            result = result.map(status => ({
                ...status,
                'Games Hosted': maxValues.games > 0 ? Math.round((status._rawGames / maxValues.games) * 100) : 0,
                'Average Athletes': maxValues.athletes > 0 ? Math.round((status._rawAthletes / maxValues.athletes) * 100) : 0,
                'Average Cost (Billions)': maxValues.cost > 0 ? Math.round((status._rawCost / maxValues.cost) * 100) : 0,
                'Average Revenue (Billions)': maxValues.revenue > 0 ? Math.round((status._rawRevenue / maxValues.revenue) * 100) : 0
            }));
        }

        console.log('Development status data:', result);
        console.log('Raw status data before calculation:', statusData);
        return result;
    };

    // Get data for display
    const barData = getBarData();

    if (loading) {
        return (
            <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
                <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                    🏛️ Development Status of Olympic Host Countries
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
                    🏛️ Development Status of Olympic Host Countries
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

    const metrics = ['Games Hosted', 'Average Athletes', 'Average Cost (Billions)', 'Average Revenue (Billions)'];
    const metricColors = {
        'Games Hosted': '#3b82f6',        // Blue
        'Average Athletes': '#10b981',     // Green
        'Average Cost (Billions)': '#ef4444',      // Red
        'Average Revenue (Billions)': '#f59e0b'    // Amber
    };
    
    // Filter metrics based on visibility
    const visibleMetricList = metrics.filter(metric => visibleMetrics[metric]);
    
    // Use single color for current metric
    const currentColor = metricColors[selectedMetric] || '#3b82f6';
    
    // Toggle metric visibility and select it
    const toggleMetric = (metric) => {
        if (selectedMetric === metric) {
            // If clicking current metric, hide it and select first visible one
            setVisibleMetrics(prev => ({
                ...prev,
                [metric]: !prev[metric]
            }));
            const nextMetric = metrics.find(m => m !== metric && visibleMetrics[m]);
            if (nextMetric) setSelectedMetric(nextMetric);
        } else {
            // Select new metric and make it visible
            setSelectedMetric(metric);
            setVisibleMetrics(prev => ({
                ...prev,
                [metric]: true
            }));
        }
    };

    return (
        <div className="p-6 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
            <h3 className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-900 dark:text-gray-200">
                🏛️ Development Status of Olympic Host Countries
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
                                Absolute Values
                            </button>
                            <button
                                onClick={() => setDisplayMode('normalized')}
                                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                                    displayMode === 'normalized'
                                        ? 'bg-emerald-500 text-white'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                Normalized (0-100)
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {displayMode === 'count' 
                            ? 'Raw values for each metric'
                            : 'Normalized values (0-100 scale) for comparison'
                        }
                    </p>
                </div>
            </div>
            
            {/* Custom Legend */}
            <div className="mb-4">
                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Metrics (click to toggle)</h4>
                <div className="flex flex-wrap gap-2">
                    {metrics.map(metric => (
                        <button
                            key={metric}
                            onClick={() => toggleMetric(metric)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                selectedMetric === metric
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-2 border-gray-300 dark:border-gray-600 opacity-50'
                            }`}
                            style={{ 
                                borderColor: selectedMetric === metric ? metricColors[metric] : undefined 
                            }}
                        >
                            <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: metricColors[metric] }}
                            />
                            {metric}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="mt-6">
                <div className="h-96 md:h-[500px]">
                    <ResponsiveBar
                        data={barData.map(item => ({
                            status: item.status,
                            value: item[selectedMetric] || 0
                        }))}
                        keys={['value']}
                        indexBy="status"
                        margin={{ top: 50, right: 30, bottom: 50, left: 80 }}
                        padding={0.3}
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={[currentColor]}
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
                            legend: 'Country Development Status',
                            legendPosition: 'middle',
                            legendOffset: 32
                        }}
                        axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: displayMode === 'normalized' ? `${selectedMetric} (0-100)` : selectedMetric,
                            legendPosition: 'middle',
                            legendOffset: -60
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
                        tooltip={({ value, data }) => (
                            <div className="p-3 text-white bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
                                <div className="mb-2 font-bold">{data.status}</div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: currentColor }}
                                    />
                                    <span className="text-sm text-gray-300">{selectedMetric}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Value:</span>
                                    <span>
                                        {typeof value === 'number' ? value.toLocaleString() : value}
                                        {displayMode === 'normalized' ? '/100' : ''}
                                    </span>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Development Status Info Cards */}
            <div className="grid gap-4 mt-6 md:grid-cols-3">
                <div className="p-4 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 dark:border-blue-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">Industrialized Countries</h4>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        Developed economies with established infrastructure and high GDP per capita at time of hosting.
                    </p>
                </div>
                
                <div className="p-4 border border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 dark:border-orange-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <h4 className="font-semibold text-orange-700 dark:text-orange-300">Developing Countries</h4>
                    </div>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                        Emerging economies with growing infrastructure and developing economic indicators.
                    </p>
                </div>
                
                <div className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 dark:border-purple-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300">Socialist/Planned Economies</h4>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                        Former socialist states with centrally planned economies during their hosting period.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DevelopmentStatusChart;