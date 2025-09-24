'use client';

import React, { useState, useEffect } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import LoadingSpinner from '../../../components/LoadingSpinner';
import SectionHeader from "@/app/graphs/components/templates/SectionHeader";

const GeographicAnalysis = ({geojsonData}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('continent'); // 'continent' or 'country'

    useEffect(() => {
        if (!geojsonData ) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);
    }, [geojsonData]);

  // Country to continent mapping
  const getContinent = (country) => {
    const continentMap = {
      // Europe
      'Greece': 'Europe', 'France': 'Europe', 'United Kingdom': 'Europe', 'Sweden': 'Europe',
      'Belgium': 'Europe', 'Netherlands': 'Europe', 'Switzerland': 'Europe', 'Germany': 'Europe',
      'Norway': 'Europe', 'Finland': 'Europe', 'Italy': 'Europe', 'Austria': 'Europe',
      'Yugoslavia': 'Europe', 'Spain': 'Europe', 'Russia': 'Europe', 'Bosnia and Herzegovina': 'Europe',

      // North America
      'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',

      // Asia
      'Japan': 'Asia', 'South Korea': 'Asia', 'China': 'Asia',

      // Oceania
      'Australia': 'Oceania',

      // South America
      'Brazil': 'South America',

        // Africa
      'South Africa': 'Africa'
    };

      return continentMap[country] || 'Other';
  };

  // Extract country from location or use known mappings
  const getCountryFromLocation = (location, gameYear) => {
    const locationCountryMap = {
      'Athens': 'Greece', 'Athina': 'Greece',
      'Paris': 'France',
      'St. Louis': 'United States', 'Los Angeles': 'United States', 'Atlanta': 'United States',
      'Lake Placid': 'United States', 'Squaw Valley': 'United States', 'Salt Lake City': 'United States',
      'London': 'United Kingdom',
      'Stockholm': 'Sweden',
      'Antwerp': 'Belgium',
      'Chamonix': 'France',
      'Amsterdam': 'Netherlands',
      'St. Moritz': 'Switzerland',
      'Berlin': 'Germany',
      'Garmisch Partenkirchen': 'Germany',
      'Helsinki': 'Finland',
      'Oslo': 'Norway',
      'Cortina d Ampezzo': 'Italy',
      'Melbourne': 'Australia',
      'Rome': 'Italy',
      'Innsbruck': 'Austria',
      'Tokyo': 'Japan',
      'Grenoble': 'France',
      'Mexico City': 'Mexico',
      'Munich': 'Germany',
      'Sapporo': 'Japan',
      'Montreal': 'Canada',
      'Moscow': 'Russia',
      'Sarajevo': 'Yugoslavia',
      'Calgary': 'Canada',
      'Seoul': 'South Korea',
      'Albertville': 'France',
      'Barcelona': 'Spain',
      'Lillehammer': 'Norway',
      'Nagano': 'Japan',
      'Sydney': 'Australia',
      'Turin': 'Italy',
      'Beijing': 'China',
      'Vancouver': 'Canada',
      'Sochi': 'Russia',
      'Rio': 'Brazil',
      'Pyeongchang': 'South Korea'
    };

      return locationCountryMap[location] || location;
  };

  // Process data for Continental/Country Distribution
  const getDistributionData = () => {
    if (!data?.games) return [];

      const distribution = {};

      data.games.forEach(game => {
      const country = getCountryFromLocation(game.location, game.year);
      const region = viewMode === 'continent' ? getContinent(country) : country;

          if (!distribution[region]) {
        distribution[region] = { venues: 0, games: 0 };
      }

          distribution[region].venues += game.venueCount;
      distribution[region].games += 1;
    });

    return Object.entries(distribution)
      .map(([region, data], index) => ({
        id: region,
        label: region,
        value: data.venues,
        games: data.games,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'][index % 8]
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Process data for Venue Density Analysis (venues per game by region)
  const getDensityData = () => {
    if (!data?.games) return [];

      const density = {};

      data.games.forEach(game => {
      const country = getCountryFromLocation(game.location, game.year);
      const region = viewMode === 'continent' ? getContinent(country) : country;

          if (!density[region]) {
        density[region] = { totalVenues: 0, totalGames: 0 };
      }

          density[region].totalVenues += game.venueCount;
      density[region].totalGames += 1;
    });

    return Object.entries(density)
      .map(([region, data]) => ({
        region,
        density: Math.round(data.totalVenues / data.totalGames * 10) / 10,
        totalVenues: data.totalVenues,
        totalGames: data.totalGames,
        color: '#6366f1'
      }))
      .sort((a, b) => b.density - a.density);
  };

  // Process data for Distance Analysis (venue spread within host cities)
  const getDistanceData = () => {
    if (!data?.games) return [];

      const distanceData = [];

      data.games.forEach(game => {
      // Group features by season
      const featuresBySeason = { Summer: [], Winter: [] };

          game.features.forEach(feature => {
        if (feature.properties.season && featuresBySeason[feature.properties.season]) {
          featuresBySeason[feature.properties.season].push(feature);
        }
      });

          // Create separate data points for each season that has venues
      Object.entries(featuresBySeason).forEach(([season, features]) => {
        if (features.length < 2) return; // Need at least 2 venues for distance calculation

          // Calculate basic venue spread metrics for this season
        const coordinates = features
          .filter(feature => feature.geometry && feature.geometry.coordinates)
          .map(feature => ({
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0]
          }));

          if (coordinates.length < 2) return;

          // Calculate bounding box dimensions (rough distance measure)
        const lats = coordinates.map(c => c.lat);
        const lngs = coordinates.map(c => c.lng);

          const latSpread = Math.max(...lats) - Math.min(...lats);
        const lngSpread = Math.max(...lngs) - Math.min(...lngs);

          // Rough distance in km (very approximate)
        const spreadKm = Math.sqrt(latSpread * latSpread + lngSpread * lngSpread) * 111; // 1 degree ≈ 111km

          distanceData.push({
          id: `${game.year} ${game.location} - ${season}`,
          data: [{
            x: features.length, // Count of venues for this season
            y: Math.round(spreadKm * 10) / 10,
            year: game.year,
            location: game.location,
            season: season
          }]
        });
      });
    });

    return distanceData;
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
        <p className="text-yellow-800 dark:text-yellow-300">No Olympic data available for geographic analysis</p>
      </div>
    );
  }

  const distributionData = getDistributionData();
  const densityData = getDensityData();
  const distanceData = getDistanceData();

  return (
    <div className="space-y-8">
        <SectionHeader headline={"🌍 Geographic Analysis"}
                       description={"Analyze Olympic venue distribution across continents and countries."}
        />
      {/* Section Header with Toggle */}
        {/*<div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-600/20 dark:to-teal-600/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-6">*/}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
              {/*  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">*/}
              {/*    🌍 Geographic Analysis*/}
              {/*    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">*/}
              {/*      Spatial Distribution & Patterns*/}
              {/*    </span>*/}
              {/*  </h2>*/}
              {/*  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">*/}
              {/*    Analyze Olympic venue distribution across continents and countries*/}
              {/*  </p>*/}
          </div>

            <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">View by:</span>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('continent')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'continent'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Continent
              </button>
              <button
                onClick={() => setViewMode('country')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'country'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                Country
              </button>
            </div>
          </div>
        </div>
        {/*</div>*/}

      {/* Distribution Analysis */}
      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
          📊 Venue Distribution
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
            by {viewMode === 'continent' ? 'Continent' : 'Country'}
          </span>
        </h3>
        <div className="h-80 chart-container">
          <style jsx>{`
            .chart-container :global(text) {
              fill: #d1d5db !important;
              font-weight: 600 !important;
            }
          `}</style>
          <ResponsivePie
            data={distributionData}
            margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
            innerRadius={0.4}
            padAngle={1}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={({ data }) => data.color}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#d1d5db"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="#f3f4f6"
            legends={[
              {
                anchor: 'right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 90,
                itemHeight: 18,
                itemTextColor: '#d1d5db',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
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

      {/* Density and Distance Analysis */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Venue Density Analysis */}
        <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
            🏗️ Venue Density
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Avg Venues per Game
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
              data={densityData}
              keys={['density']}
              indexBy="region"
              margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
              padding={0.3}
              colors={({ data }) => data.color}
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

        {/* Distance Analysis */}
        <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
            📏 Venue Spread
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Geographic Distribution
            </span>
          </h3>
          <div className="h-64 chart-container">
            <style jsx>{`
              .chart-container :global(text) {
                fill: #d1d5db !important;
                font-weight: 600 !important;
              }
            `}</style>
            <ResponsiveScatterPlot
              data={distanceData}
              margin={{ top: 20, right: 30, bottom: 60, left: 80 }}
              xScale={{ type: 'linear', min: 0, max: 'auto' }}
              yScale={{ type: 'linear', min: 0, max: 'auto' }}
              blendMode="normal"
              colors={{ scheme: 'category10' }}
              pointSize={8}
              pointColor={{ from: 'color' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'color', modifiers: [['darker', 0.3]] }}
              useMesh={true}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Number of Venues',
                legendOffset: 46,
                legendPosition: 'middle'
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Venue Spread (km)',
                legendOffset: -60,
                legendPosition: 'middle'
              }}
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
      </div>
    </div>
  );
};

export default GeographicAnalysis;
