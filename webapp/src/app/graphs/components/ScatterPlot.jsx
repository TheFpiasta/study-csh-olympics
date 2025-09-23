'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../components/LoadingSpinner';

const FIELDS = [
  { key: 'number_of_athletes', label: 'Number of Athletes' },
  { key: 'number_of_events', label: 'Number of Events' },
  { key: 'number_of_countries', label: 'Number of Countries' },
  { key: 'accredited_media', label: 'Accredited Media' },
  { key: 'ticketing_revenue_(usd2018)', label: 'Ticketing Revenue' },
  { key: 'broadcast_revenue_(usd2018)', label: 'Broadcast Revenue' },
  { key: 'international_sponsorship_revenue_(usd_2018)', label: 'International Sponsorship' },
  { key: 'domestic_sponsorship_revenue_(usd_2018)', label: 'Domestic Sponsorship' },
  { key: 'cost_of_venues_(usd_2018)', label: 'Cost of Venues' },
  { key: 'cost_of_organisation_(usd_2018)', label: 'Cost of Organisation' },
];

const ScatterPlot = ({ geojsonData }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [xField, setXField] = useState(FIELDS[0].key);
  const [yField, setYField] = useState(FIELDS[1].key);
  const [seasonFilter, setSeasonFilter] = useState('both');

  useEffect(() => {
    if (!geojsonData) return;
    setLoading(false);
    setData(geojsonData.data);
    setError(geojsonData.error);
  }, [geojsonData]);

  const getFieldValue = (harvardObj, fieldName) => {
    if (!harvardObj || !harvardObj[fieldName] || harvardObj[fieldName].data == null) return 0;
    const value = parseFloat(harvardObj[fieldName].data); // convert string to number
    return isNaN(value) ? 0 : value;
  };

  const getScatterData = () => {
    if (!data?.games) return [];

    const validGames = data.games.filter(g => g.harvard && Object.keys(g.harvard).length > 0);

    const filteredGames = validGames.filter(game => {
      if (seasonFilter === 'both') return true;
      const season =
        game.season ||
        (game.features && game.features[0]?.properties?.season) ||
        '';
      return season.toLowerCase() === seasonFilter;
    });

    return [
      {
        id: `${xField} vs ${yField}`,
        data: filteredGames.map(game => ({
          x: getFieldValue(game.harvard, xField),
          y: getFieldValue(game.harvard, yField),
          label: `${game.location} ${game.year}`,
        })),
      },
    ];
  };

  const formatAxis = value => {
    const val = Number(value);
    if (isNaN(val)) return '';
    if (Math.abs(val) >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return val.toString();
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

  return (
    <div className="space-y-8">
      <SectionHeader
        headline="Scatter Plot Analysis"
        description="Compare two metrics from the Olympic Games to explore correlations and trends."
      />

      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
        <div className="flex flex-wrap justify-between items-end mb-4 gap-4">
          {/* X/Y selectors */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X Axis</label>
              <select
                value={xField}
                onChange={e => setXField(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1"
              >
                {FIELDS.filter(f => f.key !== yField).map(field => (
                  <option key={field.key} value={field.key}>{field.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Y Axis</label>
              <select
                value={yField}
                onChange={e => setYField(e.target.value)}
                className="rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1"
              >
                {FIELDS.filter(f => f.key !== xField).map(field => (
                  <option key={field.key} value={field.key}>{field.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Season buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Olympic Season</label>
            <div className="flex gap-2">
              {['both', 'summer', 'winter'].map(season => (
                <button
                  key={season}
                  onClick={() => setSeasonFilter(season)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    seasonFilter === season
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-96 chart-container">
          <ResponsiveScatterPlot
            data={scatterData}
            margin={{ top: 20, right: 140, bottom: 70, left: 90 }}
            xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            axisBottom={{
              orient: 'bottom',
              legend: FIELDS.find(f => f.key === xField)?.label,
              legendPosition: 'middle',
              legendOffset: 46,
              tickValues: undefined,
              tickFormat: formatAxis,
            }}
            axisLeft={{
              orient: 'left',
              legend: FIELDS.find(f => f.key === yField)?.label,
              legendPosition: 'middle',
              legendOffset: -60,
              tickValues: undefined,
              tickFormat: formatAxis,
            }}
            colors={{ scheme: 'category10' }}
            pointSize={10}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            useMesh={true}
            theme={{
              axis: {
                legend: { text: { fill: '#fff', fontSize: 14, fontWeight: 600 } },
                ticks: { text: { fill: '#fff', fontSize: 12 }, line: { stroke: '#fff' } },
              },
            }}
            tooltip={({ node }) => (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
                <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">{node.data.label}</div>
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{FIELDS.find(f => f.key === xField)?.label}: </span>
                  <span>{formatAxis(node.data.x)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{FIELDS.find(f => f.key === yField)?.label}: </span>
                  <span>{formatAxis(node.data.y)}</span>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default ScatterPlot;
