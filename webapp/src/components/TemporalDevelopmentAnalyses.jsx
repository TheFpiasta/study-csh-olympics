'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { ResponsiveStream } from '@nivo/stream';
import { ResponsiveSankey } from '@nivo/sankey';
import LoadingSpinner from './LoadingSpinner';

const TemporalDevelopmentAnalyses = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonFilter, setSeasonFilter] = useState('both');

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

  // Process data for Number of venues per Olympic Games (Scatter plot by season)
  const getVenuesPerGameData = () => {
    if (!data?.games) return [];
    
    const result = [];
    
    if (seasonFilter === 'both' || seasonFilter === 'summer') {
      const summerGames = data.games
        .filter(game => game.season === 'Summer')
        .map(game => ({
          x: game.year,
          y: game.venueCount
        }));
      
      result.push({
        id: 'Summer',
        data: summerGames
      });
    }
    
    if (seasonFilter === 'both' || seasonFilter === 'winter') {
      const winterGames = data.games
        .filter(game => game.season === 'Winter')
        .map(game => ({
          x: game.year,
          y: game.venueCount
        }));
      
      result.push({
        id: 'Winter',
        data: winterGames
      });
    }
    
    return result;
  };

  // Get colors for scatter plot based on current filter
  const getScatterColors = () => {
    if (seasonFilter === 'summer') return ['#f59e0b'];
    if (seasonFilter === 'winter') return ['#06b6d4'];
    return ['#f59e0b', '#06b6d4']; // both
  };

  // Process data for Ratio of new buildings to existing facilities
  const getNewVsExistingData = () => {
    if (!data?.games) return [];
    
    return data.games.map(game => {
      let newBuildings = 0;
      let existingFacilities = 0;
      let unknown = 0;
      
      game.features.forEach(feature => {
        const props = feature.properties;
        
        if (props.classification) {
          const classification = props.classification.toLowerCase();
          if (classification.includes('new') || classification === 'temporary') {
            newBuildings++;
          } else if (classification.includes('existing') || classification.includes('renovated')) {
            existingFacilities++;
          } else {
            unknown++;
          }
        } else if (props.opened) {
          const openedYear = parseInt(props.opened.match(/(\d{4})/)?.[ 1]) || game.year;
          if (Math.abs(openedYear - game.year) <= 2) {
            newBuildings++;
          } else {
            existingFacilities++;
          }
        } else {
          unknown++;
        }
      });
      
      return {
        year: game.year,
        'New Buildings': newBuildings,
        'Existing Facilities': existingFacilities,
        'Unknown': unknown
      };
    }).sort((a, b) => a.year - b.year);
  };

  // Process data for Reuse status Sankey diagram
  const getSankeyData = () => {
    if (!data?.games) return { nodes: [], links: [] };
    
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
      nodes.push({ id: decade });
    });
    
    // Add status nodes
    const allStatuses = new Set();
    Object.values(olympicToStatus).forEach(statuses => {
      Object.keys(statuses).forEach(status => allStatuses.add(status));
    });
    
    allStatuses.forEach(status => {
      nodes.push({ id: status });
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
    
    return { nodes, links };
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
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-300">No Olympic data available</p>
      </div>
    );
  }

  return (
      <div className="space-y-8">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-600/20 dark:to-orange-600/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                      ⏳ Temporal development analyses
                      <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                          Infrastructure Evolution Over Time
                      </span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Analysis of Olympic venue development patterns over time, infrastructure evolution, and historical trends
                  </p>
              </div>
          </div>

          {/* Number of venues per Olympic Games */}
          <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  📊 Number of venues per Olympic Games
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Scatter Plot
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
              <div className="h-80 chart-container">
                  <style jsx>{`
                      .chart-container :global(text) {
                          fill: #d1d5db !important;
                          font-weight: 600 !important;
                      }
                  `}</style>
                  <ResponsiveScatterPlot
                      data={getVenuesPerGameData()}
                      margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                      xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
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
                      legends={[
                          {
                              anchor: 'bottom-right',
                              direction: 'column',
                              justify: false,
                              translateX: 100,
                              translateY: 0,
                              itemWidth: 80,
                              itemHeight: 20,
                              itemsSpacing: 2,
                              itemDirection: 'left-to-right',
                              itemTextColor: '#d1d5db',
                              symbolSize: 12,
                              symbolShape: 'circle'
                          }
                      ]}
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
          </div>

          {/* Ratio of new buildings to existing facilities over time */}
          <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  🏗️ Ratio of new buildings to existing facilities over time
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Stream Chart
                  </span>
              </h3>
              <div className="h-80 chart-container">
                  <style jsx>{`
                      .chart-container :global(text) {
                          fill: #d1d5db !important;
                          font-weight: 600 !important;
                      }
                  `}</style>
                  <ResponsiveStream
                      data={getNewVsExistingData()}
                      keys={['New Buildings', 'Existing Facilities', 'Unknown']}
                      margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
                      colors={['#10b981', '#3b82f6', '#6b7280']}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                          orient: 'bottom',
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: -45,
                          format: d => d.toString()
                      }}
                      axisLeft={{
                          orient: 'left',
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0
                      }}
                      enableGridX={false}
                      enableGridY={true}
                      legends={[
                          {
                              anchor: 'bottom-right',
                              direction: 'column',
                              translateX: 100,
                              itemWidth: 80,
                              itemHeight: 20,
                              itemTextColor: '#d1d5db',
                              symbolSize: 12,
                              itemDirection: 'left-to-right',
                              itemOpacity: 0.85
                          }
                      ]}
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
          </div>

          {/* Reuse status of Olympic venues over time */}
          <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
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
                          margin={{ top: 40, right: 200, bottom: 40, left: 60 }}
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