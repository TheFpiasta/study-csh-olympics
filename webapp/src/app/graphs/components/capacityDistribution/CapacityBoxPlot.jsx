'use client';

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {ResponsiveBoxPlot} from '@nivo/boxplot';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../../components/LoadingSpinner';

const CapacityBoxPlot = ({geojsonData}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yearSliderRange, setYearSliderRange] = useState({min: 1896, max: 2024});
  const [sliderValues, setSliderValues] = useState({start: 1896, end: 2024});
  const [activeSlider, setActiveSlider] = useState(null);
  const [seasonFilter, setSeasonFilter] = useState('both'); // 'summer' | 'winter' | 'both'
  const [minPercentageFilled, setMinPercentageFilled] = useState(80);
  const [maxPercentageFilled, setMaxPercentageFilled] = useState(100);

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
    const dataToSet = geojsonData.data || null;
    setData(dataToSet);
    setError(geojsonData.error || null);

    // Set slider range based on actual data
    if (dataToSet?.games) {
      const years = dataToSet.games.map(game => Number(game.year)).filter(year => !isNaN(year));
      if (years.length > 0) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        setYearSliderRange({min: minYear, max: maxYear});
        setSliderValues({start: minYear, end: maxYear});
      }
    }
  }, [geojsonData]);

  // Filter games by year range, season setting and minimum percentage of features with seating_capacity
  const getFilteredGames = () => {
    if (!data?.games) return [];

    return data.games.filter(game => {
      const year = Number(game.year);
      const seasonRaw = (game.season || game.features?.[0]?.properties?.season || '').toString();
      const season = seasonRaw ? seasonRaw.toLowerCase() : '';

      const inRange = year >= sliderValues.start && year <= sliderValues.end;
      const inSeason = seasonFilter === 'both' || (season && season === seasonFilter);

      const totalFeatures = (game.features?.length) || 0;
      const filledFeatures = (game.features || []).filter(f => f.properties?.seating_capacity != null && f.properties?.seating_capacity !== '').length;
      const percentageFilled = totalFeatures ? (filledFeatures / totalFeatures) * 100 : 0;
      const meetsPercentage = percentageFilled >= maxPercentageFilled;

      return inRange && inSeason && meetsPercentage;
    });
  };

  // Convert filtered games into long-form observations: { group, season, value }
  const seatingObservations = useMemo(() => {
    const gamesToUse = getFilteredGames();
    console.log('Filtered games count:', gamesToUse?.length);
    console.log('Slider values:', sliderValues);
    console.log('Season filter:', seasonFilter);
    console.log('Max percentage filled:', maxPercentageFilled);

    if (!gamesToUse?.length) return [];

    const observations = [];

    gamesToUse.forEach(game => {
      const year = game.year;
      const seasonRaw = (game.season || game.features?.[0]?.properties?.season || '').toString();
      const season = seasonRaw ? seasonRaw.toLowerCase() : 'unknown';
      const location = game.location || 'Unknown';

      // group label: unique and readable
      const groupLabel = `${year} – ${location} – ${season.charAt(0).toUpperCase() + season.slice(1)}`;

      const gameObservations = [];
      (game.features || []).forEach(feature => {
        const seating_capacity = feature.properties?.seating_capacity;
        if (seating_capacity == null) return;

        // normalize numbers like "12,000"
        const cap = parseInt(String(seating_capacity).replace(/,/g, ''), 10);
        if (Number.isFinite(cap) && cap > 0) { // Ensure positive values only
          gameObservations.push({
            group: groupLabel, season, value: cap,
          });
        }
      });

      // Only add games that have at least 2 valid observations for box plot calculations
      if (gameObservations.length >= 2) {
        observations.push(...gameObservations);
      }
    });

    return observations;
  }, [data, sliderValues, seasonFilter, maxPercentageFilled]);

  // extract unique groups (games) in stable order for tick order / selects
  const uniqueGameLabels = useMemo(() => {
    const set = new Set();
    seatingObservations.forEach(o => set.add(o.group));
    return Array.from(set);
  }, [seatingObservations]);

  if (loading) {
    return (<div className="flex justify-center items-center h-64">
      <LoadingSpinner/>
    </div>);
  }

  if (error) {
    return (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <p className="text-red-800 dark:text-red-300">Error loading data: {String(error)}</p>
    </div>);
  }

  // Additional safeguard: ensure we have valid groups with sufficient data points
  const groupCounts = {};
  seatingObservations.forEach(obs => {
    groupCounts[obs.group] = (groupCounts[obs.group] || 0) + 1;
  });

  const validObservations = seatingObservations.filter(obs => groupCounts[obs.group] >= 2);

  // Create a deterministic color array that maps directly to the valid data
  const chartColors = (() => {
    // Get unique seasons from the current valid data
    const seasonsInData = new Set();
    validObservations.forEach(obs => {
      if (obs.season) {
        seasonsInData.add(obs.season.toLowerCase());
      }
    });

    // Create color array in alphabetical order to match Nivo's subgroup ordering: winter first, then summer
    const colors = [];
    if (seasonsInData.has('winter')) {
      colors.push(seasonColors.winter);
    }
    if (seasonsInData.has('summer')) {
      colors.push(seasonColors.summer);
    }

    // If no specific seasons found, use unknown color
    if (colors.length === 0) {
      colors.push(seasonColors.unknown);
    }

    return colors;
  })();

  return (<div className="space-y-6">
    <div
      className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
        Capacity Distribution
        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Box Plot
        </span>
      </h3>

      {/* Olympic Season Filter */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Olympic Season
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSeasonFilter('both')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${seasonFilter === 'both' ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Both
          </button>
          <button
            onClick={() => setSeasonFilter('summer')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${seasonFilter === 'summer' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Summer
          </button>
          <button
            onClick={() => setSeasonFilter('winter')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${seasonFilter === 'winter' ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Winter
          </button>
        </div>
      </div>

      {/* Year Range Filter */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Year Range
        </label>
        <div className="text-center text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          {sliderValues.start} - {sliderValues.end}
        </div>
        <div className="relative">
          <div className="flex items-center gap-4">
                            <span
                              className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">{yearSliderRange.min}
                            </span>

            <div className="relative flex-1">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
                <div
                  className="absolute h-2 bg-emerald-500 rounded-lg"
                  style={{
                    left: `${(sliderValues.start - yearSliderRange.min) / (yearSliderRange.max - yearSliderRange.min) * 100}%`,
                    width: `${(sliderValues.end - sliderValues.start) / (yearSliderRange.max - yearSliderRange.min) * 100}%`
                  }}
                />
              </div>
              <input
                type="range"
                min={yearSliderRange.min}
                max={yearSliderRange.max}
                value={sliderValues.start}
                onChange={e => {
                  const newStart = parseInt(e.target.value);
                  setSliderValues(prev => ({
                    start: newStart, end: Math.max(newStart, prev.end) // Ensure end is never less than start
                  }));
                }}
                onMouseDown={() => setActiveSlider('left')}
                onMouseUp={() => setActiveSlider(null)}
                className={`range-slider-left ${activeSlider === 'left' || (sliderValues.end - sliderValues.start < (yearSliderRange.max - yearSliderRange.min) * 0.05) ? 'priority' : ''}`}
              />
              <input
                type="range"
                min={yearSliderRange.min}
                max={yearSliderRange.max}
                value={sliderValues.end}
                onChange={e => {
                  const newEnd = parseInt(e.target.value);
                  setSliderValues(prev => ({
                    start: Math.min(newEnd, prev.start), // Ensure start is never greater than end
                    end: newEnd
                  }));
                }}
                onMouseDown={() => setActiveSlider('right')}
                onMouseUp={() => setActiveSlider(null)}
                className="range-slider-right"
              />
            </div>

            <span
              className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">{yearSliderRange.max}</span>
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
        <div className="text-center text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          {maxPercentageFilled}%
        </div>
        <div className="relative">
          <div className="flex items-center gap-4">
                            <span
                              className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">0%</span>

            <div className="relative flex-1">
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
                <div
                  className="absolute h-2 bg-emerald-500 rounded-lg"
                  style={{
                    left: '0%', width: `${maxPercentageFilled}%`
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={maxPercentageFilled}
                onChange={e => {
                  const newMax = parseInt(e.target.value);
                  setMaxPercentageFilled(newMax);
                }}
                className="range-slider-right"
              />
            </div>

            <span
              className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[3rem]">100%</span>
          </div>
        </div>
      </div>

      <div className="h-[520px] w-full flex items-center justify-center overflow-hidden">
        {!seatingObservations.length ? (<div
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md text-center">
          <p className="text-yellow-800 dark:text-yellow-300">No capacity data available with current
            filters. Try adjusting the year range, season filter, or data quality threshold.</p>
        </div>) : !validObservations.length ? (<div
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md text-center">
          <p className="text-yellow-800 dark:text-yellow-300">Insufficient data points for box plot
            visualization. Each game needs at least 2 venues with capacity data.</p>
        </div>) : (<div className="w-full h-full">
          <ResponsiveBoxPlot
            data={validObservations}
            groupBy="group"
            subGroupBy="season"
            value="value"
            margin={{top: 50, right: 60, bottom: 170, left: 80}}
            padding={0.3}
            boxWidth={25}
            minValue={0}
            maxValue="auto"
            enableGridX={false}
            enableGridY={true}
            colors={chartColors}
            animate={false}
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
              legend: 'Seating Capacity', legendPosition: 'middle', legendOffset: -60,
            }}
            theme={{
              axis: {
                legend: {text: {fill: '#fff', fontSize: 14, fontWeight: 600}},
                ticks: {text: {fill: '#fff', fontSize: 11}, line: {stroke: '#444'}},
              }, tooltip: {
                container: {background: '#0f1724', color: '#fff'},
              },
            }}
            tooltip={({group, data, outliers}) => (<div
              className="bg-gray-800 text-white p-3 rounded-lg shadow-xl border border-gray-600">
              <div className="font-bold mb-2">{group}</div>

              {data?.values && (<>
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
              </>)}

              {outliers?.length > 0 && (<div
                className="mt-2 text-xs text-gray-400">Outliers: {outliers.map(o => o.toLocaleString()).join(', ')}</div>)}
            </div>)}
          />
        </div>)}
      </div>

      {/* Legend - only show when both seasons are visible */}
      {seasonFilter === 'both' && (<div className="mt-4 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm" style={{backgroundColor: seasonColors.summer}}></div>
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Summer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm" style={{backgroundColor: seasonColors.winter}}></div>
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Winter</span>
        </div>
      </div>)}
    </div>
  </div>);
};

export default CapacityBoxPlot;
