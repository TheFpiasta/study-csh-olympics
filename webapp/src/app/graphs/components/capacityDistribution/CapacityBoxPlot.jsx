'use client';

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import { ResponsiveBoxPlot } from '@nivo/boxplot';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../../components/LoadingSpinner';

const CapacityBoxPlot = ({ geojsonData }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yearRange, setYearRange] = useState({ start: '', end: '' });
  const [seasonFilter, setSeasonFilter] = useState('both'); // 'summer' | 'winter' | 'both'
  const [minPercentageFilled, setMinPercentageFilled] = useState(80);

    // explicit season colors (easy to change) - made more stable
  const seasonColors = useMemo(() => ({
      summer: '#f59e0b', // amber color matching button
      winter: '#06b6d4', // cyan color matching button
      both: '#8b5cf6', // purple color matching button
      unknown: '#6b7280', // gray fallback
  }), []);

  useEffect(() => {
    if (!geojsonData) return;

    setLoading(false);
    setData(geojsonData.data || null);
    setError(geojsonData.error || null);
  }, [geojsonData]);

  // Filter games by year range, season setting and minimum percentage of features with seating_capacity
  const getFilteredGames = () => {
    if (!data?.games) return [];

    return data.games.filter(game => {
      const year = Number(game.year);
      const seasonRaw = (game.season || game.features?.[0]?.properties?.season || '').toString();
      const season = seasonRaw ? seasonRaw.toLowerCase() : '';

      const start = parseInt(yearRange.start, 10);
      const end = parseInt(yearRange.end, 10);

      const inRange =
        (!start && !end) ||
        (start && !end && year >= start) ||
        (!start && end && year <= end) ||
        (start && end && year >= start && year <= end);

      const inSeason = seasonFilter === 'both' || (season && season === seasonFilter);

      const totalFeatures = (game.features?.length) || 0;
      const filledFeatures = (game.features || []).filter(f => f.properties?.seating_capacity != null && f.properties?.seating_capacity !== '').length;
      const percentageFilled = totalFeatures ? (filledFeatures / totalFeatures) * 100 : 0;
      const meetsPercentage = percentageFilled >= minPercentageFilled;

      return inRange && inSeason && meetsPercentage;
    });
  };

  // Convert filtered games into long-form observations: { group, season, value }
  const seatingObservations = useMemo(() => {
    const gamesToUse = getFilteredGames();
    if (!gamesToUse?.length) return [];

    const observations = [];

    gamesToUse.forEach(game => {
      const year = game.year;
      const seasonRaw = (game.season || game.features?.[0]?.properties?.season || '').toString();
      const season = seasonRaw ? seasonRaw.toLowerCase() : 'unknown';
      const location = game.location || 'Unknown';

      // group label: unique and readable
      const groupLabel = `${year} – ${location} – ${season.charAt(0).toUpperCase() + season.slice(1)}`;

      (game.features || []).forEach(feature => {
        const seating_capacity = feature.properties?.seating_capacity;
        if (seating_capacity == null) return;

        // normalize numbers like "12,000"
        const cap = parseInt(String(seating_capacity).replace(/,/g, ''), 10);
        if (Number.isFinite(cap)) {
          observations.push({
            group: groupLabel,
            season,
            value: cap,
          });
        }
      });
    });

    return observations;
  }, [data, yearRange, seasonFilter, minPercentageFilled]);

  // extract unique groups (games) in stable order for tick order / selects
  const uniqueGameLabels = useMemo(() => {
    const set = new Set();
    seatingObservations.forEach(o => set.add(o.group));
    return Array.from(set);
  }, [seatingObservations]);

    // Create a deterministic color array that maps directly to the data
    const chartColors = useMemo(() => {
        // Get unique seasons from the current data
        const seasonsInData = new Set();
        seatingObservations.forEach(obs => {
            if (obs.season) {
                seasonsInData.add(obs.season.toLowerCase());
            }
        });

        // Create color array in consistent order: summer first, then winter
        const colors = [];
        if (seasonsInData.has('summer')) {
            colors.push(seasonColors.summer);
        }
        if (seasonsInData.has('winter')) {
            colors.push(seasonColors.winter);
        }

        // If no specific seasons found, use unknown color
        if (colors.length === 0) {
            colors.push(seasonColors.unknown);
        }

        return colors;
    }, [seatingObservations, seasonColors]);

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
        <p className="text-red-800 dark:text-red-300">Error loading data: {String(error)}</p>
      </div>
    );
  }

  if (!seatingObservations.length) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-300">No capacity data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          {/* Year Range Filter */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year Range
              </label>
              <div className="flex flex-wrap items-center gap-4">
                  <div className="flex gap-2 items-center">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">From:</label>
                      <select
                          value={yearRange.start}
                          onChange={e => setYearRange(prev => ({...prev, start: e.target.value}))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                          <option value="">All</option>
                          {Array.from(new Set((data?.games || []).map(g => g.year))).sort((a, b) => a - b).map(y => (
                              <option key={y} value={y}>{y}</option>
                          ))}
                      </select>

                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">To:</label>
                      <select
                          value={yearRange.end}
                          onChange={e => setYearRange(prev => ({...prev, end: e.target.value}))}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                          <option value="">All</option>
                          {Array.from(new Set((data?.games || []).map(g => g.year))).sort((a, b) => a - b).map(y => (
                              <option key={y} value={y}>{y}</option>
                          ))}
                      </select>

                      <button
                          onClick={() => setYearRange({start: '', end: ''})}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                          Reset
                      </button>
                  </div>
              </div>
          </div>

          {/* Data Quality Filter */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data Quality Threshold
                  <span className={"ml-3 text-xs text-gray-500 dark:text-gray-400"}>
                  (Only include games where at least this percentage of venues have seating capacity data. 0% = all games, 100% = only games where all venues have seating data)
              </span>
              </label>
              <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Min % seating data:</label>
            <input
              type="range"
              min={0}
              max={100}
              value={minPercentageFilled}
              onChange={e => setMinPercentageFilled(Number(e.target.value))}
              className="flex-1 h-2 rounded-lg accent-emerald-500"
            />
                  <span
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[3rem]">{minPercentageFilled}%</span>
              </div>
          </div>

          {/* Olympic Season Filter */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
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

        <div className="h-[520px]">
          <ResponsiveBoxPlot
            data={seatingObservations}
            groupBy="group"
            subGroupBy="season"
            value="value"
            margin={{top: 50, right: 60, bottom: 170, left: 80}}
            padding={0.3}
            boxWidth={25}
            minValue="auto"
            maxValue="auto"
            enableGridX={false}
            enableGridY={true}
            colors={chartColors}
            animate={true}
            motionConfig="gentle"
            axisBottom={{
              legend: 'Game (Year - Location - Season)',
              legendPosition: 'middle',
                legendOffset: 140,
              tickRotation: -45,
              tickSize: 6,
              tickPadding: 10,
              truncateTickAt: 30,
            }}
            axisLeft={{
              legend: 'Seating Capacity',
              legendPosition: 'middle',
              legendOffset: -60,
            }}
            theme={{
              axis: {
                legend: { text: { fill: '#fff', fontSize: 14, fontWeight: 600 } },
                ticks: { text: { fill: '#fff', fontSize: 11 }, line: { stroke: '#444' } },
              },
              tooltip: {
                container: { background: '#0f1724', color: '#fff' },
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
                  <div className="mt-2 text-xs text-gray-400">Outliers: {outliers.map(o => o.toLocaleString()).join(', ')}</div>
                )}
              </div>
            )}
          />
        </div>

          {/* Legend - only show when both seasons are visible */}
          {seasonFilter === 'both' && (
              <div className="mt-4 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-sm" style={{backgroundColor: seasonColors.summer}}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Summer</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-sm" style={{backgroundColor: seasonColors.winter}}></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Winter</span>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default CapacityBoxPlot;
