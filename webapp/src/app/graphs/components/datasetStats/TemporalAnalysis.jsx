'use client';

import React, {useState, useEffect} from 'react';
import {ResponsiveLine} from '@nivo/line';
import {ResponsiveBar} from '@nivo/bar';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import logger from '@/components/logger';
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";
import {getColorFromPalet, getSeasonColor} from "@/app/graphs/components/utility";

const TemporalAnalysis = ({geojsonData}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!geojsonData) return;

    setLoading(false);
    setData(geojsonData.data);
    setError(geojsonData.error);
  }, [geojsonData]);

  // Process data for Venue Lifespan Analysis
  const getLifespanData = () => {
    if (!data?.games) return [];

    const lifespanCategories = {
      'Active (50+ years)': 0,
      'Long-term (20-50 years)': 0,
      'Medium-term (5-20 years)': 0,
      'Short-term (1-5 years)': 0,
      'Demolished/Dismantled': 0,
      'Unknown': 0
    };

    data.games.forEach(game => {
      game.features.forEach(feature => {
        const props = feature.properties;
        const currentYear = new Date().getFullYear();

        // Check status first
        if (props.status) {
          const status = props.status.toLowerCase();
          if (status.includes('dismantled') || status.includes('demolished') || status.includes('destroyed')) {
            lifespanCategories['Demolished/Dismantled']++;
            return;
          }
        }

        // Check classification for temporary venues
        if (props.classification && props.classification.toLowerCase() === 'temporary') {
          lifespanCategories['Short-term (1-5 years)']++;
          return;
        }

        // Calculate based on opening year
        if (props.opened) {
          let openedYear;

          // Parse different date formats
          if (props.opened.includes('BC')) {
            // Very old venues like Panathenaic Stadium
            lifespanCategories['Active (50+ years)']++;
            return;
          } else if (props.opened.match(/^\d{4}$/)) {
            openedYear = parseInt(props.opened);
          } else if (props.opened.match(/^\d{4}-\d{4}$/)) {
            // Range like "1888-89"
            openedYear = parseInt(props.opened.split('-')[0]);
          } else {
            // Try to extract year from string
            const yearMatch = props.opened.match(/(\d{4})/);
            if (yearMatch) {
              openedYear = parseInt(yearMatch[1]);
            }
          }

          if (openedYear) {
            const age = currentYear - openedYear;

            if (age >= 50) lifespanCategories['Active (50+ years)']++;
            else if (age >= 20) lifespanCategories['Long-term (20-50 years)']++;
            else if (age >= 5) lifespanCategories['Medium-term (5-20 years)']++;
            else lifespanCategories['Short-term (1-5 years)']++;
          } else {
            lifespanCategories['Unknown']++;
          }
        } else {
          // No opening date, try to infer from Olympic year
          const olympicYear = game.year;
          const age = currentYear - olympicYear;

          if (age >= 50) lifespanCategories['Active (50+ years)']++;
          else if (age >= 20) lifespanCategories['Long-term (20-50 years)']++;
          else if (age >= 5) lifespanCategories['Medium-term (5-20 years)']++;
          else lifespanCategories['Short-term (1-5 years)']++;
        }
      });
    });

    return Object.entries(lifespanCategories).map(([category, count], index) => ({
      category,
      count,
      color: '#6366f1' //getColorFromPalet(index, Object.keys(lifespanCategories).length)
    }));
  };

  // Process data for Seasonal Patterns
  const getSeasonalData = () => {
    if (!data?.games) return [];

    const seasonalData = data.games.reduce((acc, game) => {
      // Process each feature to count venues by season
      game.features.forEach(feature => {
        const season = feature.properties.season && feature.properties.season.length > 0 ?
          feature.properties.season.charAt(0).toUpperCase() + feature.properties.season.slice(1) :
          'Unknown';
        if (!acc[season]) {
          acc[season] = {venues: 0, games: new Set()};
        }
        acc[season].venues += 1;
        acc[season].games.add(`${game.year}-${game.location}`);
      });
      return acc;
    }, {});

    return Object.entries(seasonalData).map(([season, data]) => ({
      season,
      venues: data.venues,
      games: data.games.size,
      avgVenuesPerGame: Math.round(data.venues / data.games.size * 10) / 10,
      color: getSeasonColor(season)
    }));
  };

  // Process data for Decade Comparison
  const getDecadeData = () => {
    if (!data?.games) return [];

    const decadeData = data.games.reduce((acc, game) => {
      const decade = Math.floor(game.year / 10) * 10;
      const decadeKey = `${decade}s`;

      if (!acc[decadeKey]) {
        acc[decadeKey] = {venues: 0, games: 0, capacities: []};
      }

      acc[decadeKey].venues += game.venueCount;
      acc[decadeKey].games += 1;

      // Collect capacity data
      game.features.forEach(feature => {
        if (feature.properties.seating_capacity) {
          // Parse capacity from different formats
          let capacity = feature.properties.seating_capacity;

          if (typeof capacity === 'string') {
            // Handle formats like "80,000 (1896) / 45,000 (2004)" or "5000"
            const match = capacity.match(/(\d{1,3}(?:,\d{3})*)/);
            if (match) {
              const parsedCapacity = parseInt(match[1].replace(/,/g, ''));
              if (!isNaN(parsedCapacity)) {
                acc[decadeKey].capacities.push(parsedCapacity);
              }
            }
          } else if (typeof capacity === 'number') {
            acc[decadeKey].capacities.push(capacity);
          }
        }
      });

      return acc;
    }, {});

    return Object.entries(decadeData).map(([decade, data]) => {
      const avgCapacity = data.capacities.length > 0
        ? Math.round(data.capacities.reduce((sum, cap) => sum + cap, 0) / data.capacities.length)
        : 0;

      return {
        decade,
        venues: data.venues,
        games: data.games,
        avgVenuesPerGame: Math.round(data.venues / data.games * 10) / 10,
        avgCapacity,
        color: '#6366f1'
      };
    }).sort((a, b) => parseInt(a.decade) - parseInt(b.decade));
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
        {data && (
          <pre className="text-xs mt-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  const lifespanData = getLifespanData();
  const seasonalData = getSeasonalData();
  const decadeData = getDecadeData();

  logger.debug('Processed data:', {
    dataExists: !!data,
    gameCount: data?.games?.length,
    firstGame: data?.games?.[0],
    lifespanData: lifespanData.length,
    seasonalData: seasonalData.length,
    decadeData: decadeData.length
  });

  return (
    <div className="space-y-8">
      <SectionHeader headline={"Dataset Statistics"}
                     description={"Exploring the evolution, usage patterns, and lifecycle of Olympic venues through data visualizations."}
      />

      {/* Summary Stats */}
      <div className="mx-4 mb-8 grid md:grid-cols-4 gap-4">
        <div
          className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <div className="text-2xl font-bold">{data?.totalGames || 0}</div>
          <div className="text-sm opacity-90">Olympic Games</div>
        </div>
        <div
          className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <div className="text-2xl font-bold">{data?.totalVenues || 0}</div>
          <div className="text-sm opacity-90">Total Venues</div>
        </div>
        <div
          className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <div className="text-2xl font-bold">
            {data?.games ? Math.round(data.totalVenues / data.totalGames * 10) / 10 : 0}
          </div>
          <div className="text-sm opacity-90">Avg Venues/Game</div>
        </div>
        <div
          className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <div className="text-2xl font-bold">
            {data?.games ? data.games[data.games.length - 1]?.year - data.games[0]?.year : 0}
          </div>
          <div className="text-sm opacity-90">Years Span</div>
        </div>
      </div>

      {/* Venue Lifespan Analysis */}
      <div
        className="mx-4 mb-8 bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
          🏗️ Venue Lifespan Analysis
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    Post-Olympic Usage Patterns
                    </span>
        </h3>
        <div className="h-80 chart-container">
          <style jsx>{`
            .chart-container :global(text) {
              fill: #d1d5db !important;
              font-weight: 600 !important;
            }
          `}</style>
          <ResponsiveBar
            data={lifespanData}
            keys={['count']}
            indexBy="category"
            margin={{top: 20, right: 30, bottom: 80, left: 60}}
            padding={0.3}
            colors={({data}) => data.color}
            enableGridX={true}
            enableGridY={true}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0
            }}
            labelTextColor="#f3f4f6"
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
              },
              labels: {
                text: {
                  fontSize: 11,
                  fill: '#f3f4f6',
                  fontWeight: 600,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Seasonal Patterns & Decade Comparison */}
      <div className="mx-4 mb-8 grid lg:grid-cols-2 gap-8">
        {/* Seasonal Patterns */}
        <div
          className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
            ❄️☀️ Seasonal Patterns
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Summer vs Winter
            </span>
          </h3>
          <div className="h-64 chart-container">
            <style jsx>{`
              .chart-container :global(text) {
                fill: #d1d5db !important;
                font-weight: 600 !important;
              }
            `}</style>
            <ResponsiveBar
              data={seasonalData}
              keys={['venues']}
              indexBy="season"
              margin={{top: 20, right: 30, bottom: 50, left: 60}}
              padding={0.4}
              colors={({data}) => data.color}
              enableGridX={true}
              enableGridY={true}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
              }}
              labelTextColor="#f3f4f6"
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
                },
                labels: {
                  text: {
                    fontSize: 11,
                    fill: '#f3f4f6',
                    fontWeight: 600,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Decade Comparison */}
        <div
          className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
            📅 Decade Comparison
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Venue Trends by Era
            </span>
          </h3>
          <div className="h-64 chart-container">
            <style jsx>{`
              .chart-container :global(text) {
                fill: #d1d5db !important;
                font-weight: 600 !important;
              }
            `}</style>
            <ResponsiveBar
              data={decadeData}
              keys={['avgVenuesPerGame']}
              indexBy="decade"
              margin={{top: 20, right: 30, bottom: 50, left: 60}}
              padding={0.3}
              colors={({data}) => data.color}
              enableGridX={true}
              enableGridY={true}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0
              }}
              labelTextColor="#f3f4f6"
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
                },
                labels: {
                  text: {
                    fontSize: 11,
                    fill: '#f3f4f6',
                    fontWeight: 600,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalAnalysis;
