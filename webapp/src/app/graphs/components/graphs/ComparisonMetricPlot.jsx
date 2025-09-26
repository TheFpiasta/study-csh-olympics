import {useEffect, useRef, useState} from "react";
import {ResponsiveScatterPlot} from '@nivo/scatterplot';
import {getSeasonColor} from "@/app/graphs/components/utility";
import {olympicColors} from "@/components/utility";
import SectionGraphHeadline from "@/app/graphs/components/templates/SectionGraphHeadline";

export default function ComparisonMetricPlot({data}) {
    const [scatterData, setScatterData] = useState([]);
    const [seasonFilter, setSeasonFilter] = useState('both');
    const [xAxisMetric, setXAxisMetric] = useState('');
    const [yAxisMetric, setYAxisMetric] = useState('');
    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [isMinimized, setIsMinimized] = useState(true);
    const initialLoadRef = useRef(true);

    // Helper function to get value from Harvard data
    const getFieldValue = (harvardObj, fieldName) => {
        if (!harvardObj || !harvardObj[fieldName] || harvardObj[fieldName].data == null) return null;
        let value = parseFloat(harvardObj[fieldName].data);
        if (isNaN(value)) return null;

        // Convert currency values to millions
        const metric = availableMetrics.find(m => m.key === fieldName);
        if (metric && metric.format === 'currency') {
            value = value / 1000000;
        }

        return value;
    };

    // Initialize available metrics based on Harvard data
    useEffect(() => {
        if (!data) return;

        if (data.games && initialLoadRef.current) {
            // Extract all available Harvard metrics
            const metricsMap = new Map();

            data.games.forEach(game => {
                if (game.harvard) {
                    Object.keys(game.harvard).forEach(key => {
                        if (game.harvard[key] && game.harvard[key].data !== null) {
                            const harvardMetric = game.harvard[key];
                            const actualFormat = harvardMetric.format;
                            const unit = harvardMetric.currency || harvardMetric.unit || '';

                            metricsMap.set(key, {format: actualFormat, unit: unit});
                        }
                    });
                }
            });

            // Convert to array and create human-readable names
            const metrics = Array.from(metricsMap.entries())
                .map(([key, datum]) => {
                    let name = key.replace(/_/g, ' ');

                    // Clean up naming
                    name = name
                        .replace(/\s*\(usd\s*2018\)/gi, '')
                        .replace(/\s*\(usd_2018\)/gi, '')
                        .replace(/\s*\(2018\)/gi, '');

                    // Add unit information if available
                    if (datum.format === 'currency' && datum.unit) {
                        name = `${name} (M ${datum.unit} 2018)`;
                    } else if (datum.format === 'currency') {
                        name = `${name} (M USD 2018)`;
                    } else if (datum.unit) {
                        name = `${name} (${datum.unit})`;
                    }

                    return {
                        key: key,
                        name: name,
                        format: datum.format,
                        unit: datum.unit
                    };
                })
                .filter(metric => {
                    // For currency metrics, only include USD 2018 values
                    if (metric.format === 'currency') {
                        return metric.key.includes('2018') || metric.key.includes('usd2018');
                    }
                    // Include other numeric metrics
                    if (['number', 'integer'].includes(metric.format)) {
                        return true;
                    }
                    // Include specific known metrics even without explicit format
                    return ['number_of_athletes', 'number_of_events', 'number_of_countries', 'accredited_media'].includes(metric.key);
                });

            setAvailableMetrics(metrics);

            // Set default metrics if available
            if (metrics.length >= 2) {
                setXAxisMetric(metrics[0].key);
                setYAxisMetric(metrics[1].key);
            }

            initialLoadRef.current = false;
        }
    }, [data]);

    // Process scatter plot data when filters change
    useEffect(() => {
        if (!data || !data.games || !xAxisMetric || !yAxisMetric) {
            setScatterData([]);
            return;
        }

        const processedData = [];

        // Filter games by season
        let filteredGames = data.games.filter(game => game.harvard);

        if (seasonFilter !== 'both') {
            filteredGames = filteredGames.filter(game => {
                const gameSeason = game.features && game.features.length > 0 ?
                    game.features[0].properties.season : null;
                return gameSeason && gameSeason.toLowerCase() === seasonFilter.toLowerCase();
            });
        }

        // Create scatter data points
        const dataPoints = filteredGames
            .map(game => {
                const xValue = getFieldValue(game.harvard, xAxisMetric);
                const yValue = getFieldValue(game.harvard, yAxisMetric);

                // Skip games without both values
                if (xValue === null || yValue === null) return null;

                const gameSeason = game.features && game.features.length > 0 ?
                    game.features[0].properties.season : 'Unknown';

                return {
                    x: xValue,
                    y: yValue,
                    id: `${game.location} ${game.year}`,
                    location: game.location,
                    year: game.year,
                    season: gameSeason
                };
            })
            .filter(point => point !== null);

        if (seasonFilter === 'both') {
            // Separate by season
            const summerData = dataPoints.filter(point =>
                point.season && point.season.toLowerCase() === 'summer'
            );
            const winterData = dataPoints.filter(point =>
                point.season && point.season.toLowerCase() === 'winter'
            );

            const series = [];
            if (summerData.length > 0) {
                series.push({
                    id: 'Summer Olympics',
                    data: summerData
                });
            }
            if (winterData.length > 0) {
                series.push({
                    id: 'Winter Olympics',
                    data: winterData
                });
            }

            setScatterData(series);
        } else {
            // Single season
            setScatterData([{
                id: `${seasonFilter.charAt(0).toUpperCase() + seasonFilter.slice(1)} Olympics`,
                data: dataPoints
            }]);
        }
    }, [data, xAxisMetric, yAxisMetric, seasonFilter]);

    // Get metric display name
    const getMetricDisplayName = (metricKey) => {
        const metric = availableMetrics.find(m => m.key === metricKey);
        return metric ? metric.name : metricKey.replace(/_/g, ' ');
    };

    // Format value for display in tooltip
    const formatValue = (value, metricKey) => {
        if (typeof value !== 'number') return value;

        const metric = availableMetrics.find(m => m.key === metricKey);
        if (metric && metric.format === 'currency') {
            return `${value.toLocaleString()} M`;
        }

        return value.toLocaleString();
    };

    return (
        <div
            className="mx-4 mb-8 bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
            <SectionGraphHeadline headline="Financial & Event Metrics Comparison"
                                  description="Compare financial costs, revenues, and event statistics across Summer and Winter Olympics"
                                  infoText="Currency values are converted to millions USD (2018). Data points can be filtered by season and custom X/Y axis combinations allow exploration of correlations between different Olympic metrics."
            >
            </SectionGraphHeadline>

            {/* Layout with filters on left and chart on right */}
            <div className="flex gap-6">
                {/* Filters - Left side */}
                <div className="w-1/4 space-y-4">
                    {/* Olympic Season Filter - First */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Olympic Season
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSeasonFilter('both')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    seasonFilter === 'both'
                                        ? 'bg-purple-500 text-white'
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

                    {/* X and Y Axis Metrics - Side by side */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="grid grid-cols-1 gap-4">
                            {/* X-Axis Metric Selection */}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    X-Axis Metric
                                </label>
                                <select
                                    value={xAxisMetric}
                                    onChange={(e) => setXAxisMetric(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select X-Axis Metric</option>
                                    {availableMetrics.map(metric => (
                                        <option key={metric.key} value={metric.key}>
                                            {metric.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Y-Axis Metric Selection */}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Y-Axis Metric
                                </label>
                                <select
                                    value={yAxisMetric}
                                    onChange={(e) => setYAxisMetric(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="">Select Y-Axis Metric</option>
                                    {availableMetrics.map(metric => (
                                        <option key={metric.key} value={metric.key}>
                                            {metric.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Chart Size Toggle */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Chart Size
                        </label>
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className={`w-full px-3 py-2 rounded-md text-sm font-medium transition-colors 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-600 hover`}
                        >
                            {isMinimized ? (
                                <>
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7m3-3v6"/>
                                    </svg>
                                    Maximize Chart
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"/>
                                    </svg>
                                    Minimize Chart
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Chart - Right side */}
                <div className="w-3/4 flex flex-col items-center">
                    {scatterData.length > 0 && xAxisMetric && yAxisMetric ? (
                        <>
                            <div style={{
                                height: isMinimized ? 'min(40vh, 40vw)' : 'min(80vh, 80vw)',
                                width: isMinimized ? 'min(40vh, 40vw)' : 'min(80vh, 80vw)'
                            }}>
                                <div className="w-full h-full chart-container">
                                    <style jsx>{`
                                        .chart-container :global(text) {
                                            fill: #d1d5db !important;
                                            font-weight: 600 !important;
                                        }
                                    `}</style>
                                    <ResponsiveScatterPlot
                                        data={scatterData}
                                        margin={{top: 30, right: 20, bottom: 60, left: 70}}
                                        xScale={{type: 'linear', min: 'auto', max: 'auto'}}
                                        yScale={{type: 'linear', min: 'auto', max: 'auto'}}
                                        nodeSize={isMinimized ? 4 : 6}
                                        colors={({serieId}) => {
                                            if (serieId && serieId.includes('Summer')) return getSeasonColor('Summer');
                                            if (serieId && serieId.includes('Winter')) return getSeasonColor('Winter');
                                            return getSeasonColor(seasonFilter === 'summer' ? 'Summer' : 'Winter');
                                        }}
                                        blendMode="normal"
                                        axisTop={null}
                                        axisRight={null}
                                        axisBottom={{
                                            orient: 'bottom',
                                            tickSize: 5,
                                            tickPadding: 5,
                                            tickRotation: 0,
                                            legend: getMetricDisplayName(xAxisMetric),
                                            legendPosition: 'middle',
                                            legendOffset: 46
                                        }}
                                        axisLeft={{
                                            orient: 'left',
                                            tickSize: 5,
                                            tickPadding: 5,
                                            tickRotation: 0,
                                            legend: getMetricDisplayName(yAxisMetric),
                                            legendPosition: 'middle',
                                            legendOffset: -60
                                        }}
                                        tooltip={({node}) => (
                                            <div
                                                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-80">
                                                <div
                                                    className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                                                    {node.data.location} {node.data.year}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    {node.data.season} Olympics
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            {getMetricDisplayName(xAxisMetric)}:
                                                        </span>
                                                        <span className="text-gray-900 dark:text-gray-100 font-bold">
                                                            {formatValue(node.data.x, xAxisMetric)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                                            {getMetricDisplayName(yAxisMetric)}:
                                                        </span>
                                                        <span className="text-gray-900 dark:text-gray-100 font-bold">
                                                            {formatValue(node.data.y, yAxisMetric)}
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
                            </div>

                            {/* Custom Legend - Only show when "both" is selected */}
                            {seasonFilter === 'both' && (
                                <div className="flex flex-col items-center mt-4 gap-2 ml-12">
                                    <span
                                        className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                                        Olympic Seasons
                                    </span>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{backgroundColor: olympicColors.primary.yellow}}
                                            ></div>
                                            <span
                                                className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                Summer
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{backgroundColor: olympicColors.primary.blue}}
                                            ></div>
                                            <span
                                                className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                Winter
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-96 flex items-center justify-center">
                            <div className="text-center text-gray-600 dark:text-gray-400">
                                <p className="text-lg mb-2">📊</p>
                                <p className="text-sm">
                                    {!xAxisMetric || !yAxisMetric
                                        ? 'Select for both axes a metric'
                                        : 'No data available for the selected metrics and filters'
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
