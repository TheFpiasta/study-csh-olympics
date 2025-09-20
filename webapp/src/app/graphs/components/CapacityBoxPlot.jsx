'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveBoxPlot } from '@nivo/boxplot';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../components/LoadingSpinner';

const CapacityBoxPlot = ({ geojsonData }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yearRange, setYearRange] = useState({ start: '', end: '' });
  const [seasonFilter, setSeasonFilter] = useState('summer'); // default summer
  const [minPercentageFilled, setMinPercentageFilled] = useState(80); // default 0%

  useEffect(() => {
    if (!geojsonData) return;

    setLoading(false);
    setData(geojsonData.data);
    setError(geojsonData.error || null);
  }, [geojsonData]);

  const getFilteredGames = () => {
    if (!data?.games) return [];

    return data.games.filter(game => {
      const year = game.year;
      const season = game.season || (game.features?.[0]?.properties?.season) || '';
      const start = parseInt(yearRange.start, 10);
      const end = parseInt(yearRange.end, 10);

      // Filter by year range
      const inRange =
        (!start && !end) ||
        (start && !end && year >= start) ||
        (!start && end && year <= end) ||
        (start && end && year >= start && year <= end);

      // Filter by season
      const inSeason = season.toLowerCase() === seasonFilter;

      // Filter by percentage of features with seating_capacity
      const totalFeatures = game.features?.length || 0;
      const filledFeatures = game.features?.filter(f => f.properties?.seating_capacity).length || 0;
      const percentageFilled = totalFeatures ? (filledFeatures / totalFeatures) * 100 : 0;
      const meetsPercentage = percentageFilled >= minPercentageFilled;

      return inRange && inSeason && meetsPercentage;
    });
  };


  const getSeatingData = () => {
    const gamesToUse = getFilteredGames();
    if (!gamesToUse.length) return [];

    const result = [];

    gamesToUse.forEach(game => {
      const year = game.year;
      const season = game.season || (game.features?.[0]?.properties?.season) || '';
      const location = game.location || 'Unknown';
      
      game.features.forEach(feature => {
        const seating_capacity = feature.properties?.seating_capacity;
        if (!seating_capacity) return;

        const cap = parseInt(seating_capacity.toString().replace(/,/g, ''), 10);
        if (!isNaN(cap)) {
          result.push({ 
            group: `${year} ${location}`, 
            value: cap,
          });
        }
      });
    });

    return result;
  };

  const getSeatingFeatureCountPerGame = () => {
    if (!data?.games?.length) return [];

    return data.games.map(game => {
      const featureCount = game.features?.reduce((count, feature) => {
        if (feature.properties?.seating_capacity) return count + 1;
        return count;
      }, 0);

      return {
        year: game.year,
        location: game.location || 'Unknown',
        season: game.season || (game.features?.[0]?.properties?.season) || '',
        featureCount: featureCount || 0,
      };
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

  if (!data?.games?.length) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-300">
          No capacity data available
        </p>
      </div>
    );
  }

  const seatingData = getSeatingData();
  const uniqueYears = Array.from(new Set(data.games.map(g => g.year))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <SectionHeader
        headline="Venue Capacity Distribution"
        description="Boxplot showing seating capacity distribution of Olympic venues per year and season."
      />

      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
        {/* Timeline & Season Selector */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Left: Year range */}
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-white">From:</label>
            <select
              value={yearRange.start}
              onChange={e => setYearRange(prev => ({ ...prev, start: e.target.value }))}
              className="rounded-lg border-gray-300 dark:border-gray-700 bg-gray-700 text-white px-2 py-1"
            >
              <option value="">All</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <label className="text-sm font-medium text-white">To:</label>
            <select
              value={yearRange.end}
              onChange={e => setYearRange(prev => ({ ...prev, end: e.target.value }))}
              className="rounded-lg border-gray-300 dark:border-gray-700 bg-gray-700 text-white px-2 py-1"
            >
              <option value="">All</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <button
              onClick={() => setYearRange({ start: '', end: '' })}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white"
            >
              Reset
            </button>
          </div>

          {/* Center: Percentile Filter */}
          <div className="flex flex-grow justify-center items-center gap-4">
            <label className="text-sm font-medium text-white">Min % seating data:</label>
            <input
              type="range"
              min={0}
              max={100}
              value={minPercentageFilled}
              onChange={e => setMinPercentageFilled(Number(e.target.value))}
              className="w-48 h-2 rounded-lg accent-violet-500"
            />
            <span className="text-sm font-medium text-white">{minPercentageFilled}%</span>
          </div>

          {/* Right: Season buttons */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Olympic Season</label>
            <div className="flex gap-2">
              {['summer', 'winter'].map(season => (
                <button
                  key={season}
                  onClick={() => setSeasonFilter(season)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    seasonFilter === season
                      ? 'bg-violet-500 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-96">
          <ResponsiveBoxPlot
            data={seatingData}
            groupBy="group"
            margin={{ top: 50, right: 50, bottom: 80, left: 80 }}
            colors={{ scheme: 'category10' }}
            axisBottom={{
              legend: 'Year & Season',
              legendPosition: 'middle',
              legendOffset: 50,
            }}
            axisLeft={{
              legend: 'Seating Capacity',
              legendPosition: 'middle',
              legendOffset: -60,
            }}
            boxWidth={30}
            minValue="auto"
            maxValue="auto"
            theme={{
              axis: {
                legend: { text: { fill: '#fff', fontSize: 14, fontWeight: 600 } },
                ticks: { text: { fill: '#fff', fontSize: 12 }, line: { stroke: '#fff' } },
              },
            }}
            tooltip={({ group, data, outliers }) => (
              <div className="bg-gray-800 text-white p-3 rounded-lg shadow-xl border border-gray-600">
                <div className="font-bold mb-2">{group}</div>

                {data?.values && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Min:</span>
                      <span>{data.values[0].toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Q1:</span>
                      <span>{data.values[1].toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Median:</span>
                      <span>{data.values[2].toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Q3:</span>
                      <span>{data.values[3].toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Max:</span>
                      <span>{data.values[4].toLocaleString()}</span>
                    </div>
                  </>
                )}

                {outliers?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Outliers: {outliers.map(o => o.toLocaleString()).join(', ')}
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </div>

  );
};

export default CapacityBoxPlot;
