'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import LoadingSpinner from '../../../components/LoadingSpinner';

const SERIES_COLORS = {
  athletes: { Summer: '#e63946', Winter: '#457b9d' },
  events:   { Summer: '#f4a261', Winter: '#2a9d8f' },
  countries:{ Summer: '#a7c957', Winter: '#6a4c93' }
};

const OlympicLineChart = ({ geojsonData }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scatterSeasonFilter, setScatterSeasonFilter] = useState('both');
  const [selectedSeries, setSelectedSeries] = useState('athletes'); // Start with 'athletes'

  useEffect(() => {
    if (!geojsonData) return;

    setLoading(false);
    setData(geojsonData.data);
    setError(geojsonData.error);
  }, [geojsonData]);

  const getSeason = (game) => {
    for (const feature of game.features) {
      if (Array.isArray(feature.properties.games)) {
        const matchingGame = feature.properties.games.find((g) => g.year == game.year);
        if (matchingGame?.season) return matchingGame.season;
      }
    }
    return 'Unknown';
  };

  const getSeasonData = () => {
    const result = [];
    const summerGames = [];
    const winterGames = [];

    data.games.forEach((game) => {
      const summerFeatures = game.features.filter((feature) => feature.properties.season === 'Summer');
      const winterFeatures = game.features.filter((feature) => feature.properties.season === 'Winter');

      if (summerFeatures.length > 0 && (scatterSeasonFilter === 'both' || scatterSeasonFilter === 'summer')) {
        const summerSports = new Set();
        summerFeatures.forEach((feature) => {
          if (feature.properties.sports) {
            const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
            sports.forEach((sport) => summerSports.add(sport));
          }
        });

        const summerVenueTypes = {};
        summerFeatures.forEach((feature) => {
          const type = feature.properties.type || 'Unknown';
          summerVenueTypes[type] = (summerVenueTypes[type] || 0) + 1;
        });

        summerGames.push({
          x: game.year,
          y: summerFeatures.length,
          location: game.location,
          season: 'Summer',
          sportsCount: summerSports.size,
          venueTypes: Object.entries(summerVenueTypes).map(([type, count]) => `${type}: ${count}`).join(', '),
        });
      }

      if (winterFeatures.length > 0 && (scatterSeasonFilter === 'both' || scatterSeasonFilter === 'winter')) {
        const winterSports = new Set();
        winterFeatures.forEach((feature) => {
          if (feature.properties.sports) {
            const sports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
            sports.forEach((sport) => winterSports.add(sport));
          }
        });

        const winterVenueTypes = {};
        winterFeatures.forEach((feature) => {
          const type = feature.properties.type || 'Unknown';
          winterVenueTypes[type] = (winterVenueTypes[type] || 0) + 1;
        });

        winterGames.push({
          x: game.year,
          y: winterFeatures.length,
          location: game.location,
          season: 'Winter',
          sportsCount: winterSports.size,
          venueTypes: Object.entries(winterVenueTypes).map(([type, count]) => `${type}: ${count}`).join(', '),
        });
      }
    });

    if (summerGames.length > 0) {
      result.push({
        id: 'Summer',
        data: summerGames,
      });
    }

    if (winterGames.length > 0) {
      result.push({
        id: 'Winter',
        data: winterGames,
      });
    }

    return result;
  };

  const getScatterData = () => {
    if (!data?.games) return [];

    const validEntries = data.games.filter((g) => g.harvard && Object.keys(g.harvard).length > 0);

    const getFieldValue = (harvardObj, fieldName) => {
      if (!harvardObj || !harvardObj[fieldName] || harvardObj[fieldName].data === undefined || harvardObj[fieldName].data === null) return 0;
      const value = parseFloat(harvardObj[fieldName].data);
      return isNaN(value) ? 0 : value;
    };

    const series = [];

    ['athletes', 'events', 'countries'].forEach((type) => {
      ['Summer', 'Winter'].forEach((season) => {
        const seriesData = validEntries
          .filter((e) => getSeason(e) === season)
          .map((e) => ({
            x: e.year,
            y: getFieldValue(e.harvard, `number_of_${type}`),
            location: e.location,
            season,
          }));

        if (seriesData.length > 0) {
          series.push({
            id: `${type}-${season}`,
            data: seriesData,
          });
        }
      });
    });

    return series;
  };

  // Filter scatterData based on selectedSeries
  const getFilteredScatterData = () => {
    if (!scatterData || scatterData.length === 0) return [];

    return scatterData.filter((series) => {
      // Filter by selected series (athletes/events/countries)
      if (selectedSeries === 'athletes' && !series.id.startsWith('athletes')) return false;
      if (selectedSeries === 'events' && !series.id.startsWith('events')) return false;
      if (selectedSeries === 'countries' && !series.id.startsWith('countries')) return false;

      // Filter by season
      if (scatterSeasonFilter === 'both') return true;
      if (scatterSeasonFilter === 'summer') return series.id.endsWith('Summer');
      if (scatterSeasonFilter === 'winter') return series.id.endsWith('Winter');
      return true;
    });
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

  const scatterData = getScatterData();

  const getYearRange = () => {
    if (!data?.games) return { min: 'auto', max: 'auto' };

    const harvardGames = data.games.filter((game) => game.harvard);

    if (harvardGames.length === 0) return { min: 'auto', max: 'auto' };

    const years = harvardGames.map((game) => game.year);

    return {
      min: Math.min(...years),
      max: Math.max(...years),
    };
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-600/20 dark:to-orange-600/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
            ⏳ Temporal development analyses
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">Infrastructure Evolution Over Time</span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Analysis of the number of athletes, events, and countries over the years in Olympic Games
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap justify-between items-center">
        {/* Data Type Selector (left) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data Type
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSeries('athletes')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSeries === 'athletes'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900'
              }`}
            >
              Athletes
            </button>
            <button
              onClick={() => setSelectedSeries('events')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSeries === 'events'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setSelectedSeries('countries')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSeries === 'countries'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
              }`}
            >
              Countries
            </button>
          </div>
        </div>
        {/* Olympic Season Selector (right) */}
        <div>
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
      </div>

      {/* Scatter Plot */}
      <div className="h-80 chart-container">
        <style jsx>{`
          .chart-container :global(text) {
            fill: #d1d5db !important;
            font-weight: 600 !important;
          }
        `}</style>
        <ResponsiveScatterPlot
          data={getFilteredScatterData()}
          margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
          xScale={{ type: 'linear', min: getYearRange().min, max: getYearRange().max }}
          yScale={{ type: 'linear', min: 0, max: 'auto' }} // <-- Always start y-axis at 0
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
          axisLeft={{ tickSize: 5, tickPadding: 5, tickRotation: 0 }}
          nodeSize={8}
          useMesh={true}
          colors={node => {
            const type = node.serieId.split('-')[0];
            const season = node.data?.season || (node.serieId.includes('Summer') ? 'Summer' : 'Winter');
            return SERIES_COLORS[type][season] || '#000';
          }}
          tooltip={({ node }) => (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
              <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                {node.data.location} {node.data.x}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{node.data.season} Olympics</div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {node.serieId.split('-')[0].charAt(0).toUpperCase() + node.serieId.split('-')[0].slice(1)}:
                </span>
                <span className="text-gray-900 dark:text-gray-100">{node.data.y}</span>
              </div>
            </div>
          )}
        />
      </div>

      {/* Dynamic Custom Legend */}
      <div className="flex justify-center mt-2 flex-wrap gap-4">
        {['athletes', 'events', 'countries'].map(type => (
          selectedSeries === type && (
            <>
              <div className="flex items-center gap-2" key={`${type}-summer`}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SERIES_COLORS[type].Summer }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {type.charAt(0).toUpperCase() + type.slice(1)} (Summer)
                </span>
              </div>
              <div className="flex items-center gap-2" key={`${type}-winter`}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SERIES_COLORS[type].Winter }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {type.charAt(0).toUpperCase() + type.slice(1)} (Winter)
                </span>
              </div>
            </>
          )
        ))}
      </div>
    </div>
  );
};

export default OlympicLineChart;