'use client';

import React, { useState, useEffect } from 'react';
import { ResponsivePie } from '@nivo/pie';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../../components/LoadingSpinner';

const CityGeoAnalysis = ({geojsonData}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOlympics, setSelectedOlympics] = useState(''); // will default to latest game

  useEffect(() => {
    if (!geojsonData) return;

    setLoading(false);
    setData(geojsonData.data);
    setError(geojsonData.error || null);

    // Set default to latest game
    if (geojsonData.data?.games?.length) {
      const latestGame = geojsonData.data.games[geojsonData.data.games.length - 1];
      setSelectedOlympics(`${latestGame.location} ${latestGame.year}`);
    }
  }, [geojsonData]);

  // Filter data by selected Olympics
  const getFilteredGames = () => {
    if (!data?.games) return [];
    if (!selectedOlympics) return []; // no default yet
    return data.games.filter(game => `${game.location} ${game.year}` === selectedOlympics);
  };

  const getDistributionData = () => {
    const gamesToUse = getFilteredGames();
    if (!gamesToUse.length) return [];

    const distribution = {};

    gamesToUse.forEach(game => {
      game.features.forEach(feature => {
        const location = feature.properties.location?.toLowerCase() || '';
        const place = feature.properties.place || '';
        let key = '';

        if (location.includes('inside')) {
          key = 'At' + (place ? ` ${place}` : '');
        } else if (location.includes('outside')) {
          key = 'Near' + (place ? ` ${place}` : '');
        } else if ((location.includes('undefined') || !location) && place) {
          key = place; // keep unique entry
        } else {
          key = 'No information available';
        }

        if (!distribution[key]) {
          distribution[key] = { venues: 0, games: 0 };
        }

        distribution[key].venues += 1;
        distribution[key].games += 1;
      });
    });

    return Object.entries(distribution).map(([key, value], index) => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: value.venues,
      games: value.games,
      color: [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // purple
        '#06b6d4', // cyan
        '#84cc16', // lime
        '#f97316', // orange
        '#6366f1', // indigo
        '#14b8a6', // teal
        '#f43f5e', // rose
        '#e879f9', // pink
        '#22c55e', // green-500
        '#facc15', // yellow
        '#0ea5e9', // sky
        '#f87171'  // red-400
      ][index % 16]

    })).sort((a, b) => b.value - a.value);
  };

  // --- Rendering states ---
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <p className="text-red-800 dark:text-red-300">Error loading data: {error}</p>
    </div>
  );

  if (!data?.games || data.games.length === 0) return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
      <p className="text-yellow-800 dark:text-yellow-300">
        No Olympic venue data available
      </p>
    </div>
  );

  const distributionData = getDistributionData();

  return (
    <div className="space-y-6">

      {/* Dropdown to select Olympics */}

      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
          📊 Venues locations inside the event
        </h3>
      <div className="flex items-center gap-4 mb-4">
        <label htmlFor="olympics-select" className="font-medium text-gray-900 dark:text-gray-200">
          Select Olympics:
        </label>
        <select
          id="olympics-select"
          value={selectedOlympics}
          onChange={(e) => setSelectedOlympics(e.target.value)}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 rounded-md p-2"
        >
          {data.games.map(game => (
            <option key={`${game.location}-${game.year}`} value={`${game.location} ${game.year}`}>
              {game.location} {game.year}
            </option>
          ))}
        </select>
      </div>
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
            colors={(slice) => slice.data.color} // ensure colors display
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#d1d5db"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor="#f3f4f6"
            legends={[{
              anchor: 'right',
              direction: 'column',
              translateX: 100,
              itemWidth: 180,
              itemHeight: 24,
              itemTextColor: '#d1d5db',
              symbolSize: 12,
              symbolShape: 'circle',
            }]}
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
                  padding: '8px 12px',
                }
              },
              legends: {
                text: { fontSize: 11, fill: '#d1d5db', fontWeight: 600 }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CityGeoAnalysis;
