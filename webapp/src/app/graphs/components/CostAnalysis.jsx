'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveLine } from '@nivo/line';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../components/LoadingSpinner';

// Define the fields and colors for each series
const SERIES_FIELDS = [
	{
		key: 'ticketing_revenue_(usd2018)',
		label: 'Ticketing Revenue',
		color: '#e63946',
		winter_color: '#d62839',
	},
	{
		key: 'broadcast_revenue_(usd2018)',
		label: 'Broadcast Revenue',
		color: '#457b9d',
		winter_color: '#2a9d8f',
	},
	{
		key: 'international_sponsorship_revenue_(usd_2018)',
		label: 'International Sponsorship',
		color: '#f4a261',
		winter_color: '#f9c74f',
	},
	{
		key: 'domestic_sponsorship_revenue_(usd_2018)',
		label: 'Domestic Sponsorship',
		color: '#2a9d8f',
		winter_color: '#90be6d',
	},
	{
		key: 'cost_of_venues_(usd_2018)',
		label: 'Cost of Venues',
		color: '#a7c957',
		winter_color: '#43aa8b',
	},
	{
		key: 'cost_of_organisation_(usd_2018)',
		label: 'Cost of Organisation',
		color: '#6a4c93',
		winter_color: '#577590',
	},
];

const CostAnalysis = ({ geojsonData }) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	// Track which series are visible
	const [visibleSeries, setVisibleSeries] = useState(
		SERIES_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: true }), {})
	);
	const [seasonFilter, setSeasonFilter] = useState('both');

	useEffect(() => {
		if (!geojsonData) return;
		setLoading(false);
		setData(geojsonData.data);
		setError(geojsonData.error);
	}, [geojsonData]);

	// Helper to get value from harvard array
	const getFieldValue = (harvardObj, fieldName) => {
		if (!harvardObj || !harvardObj[fieldName] || harvardObj[fieldName].data === undefined || harvardObj[fieldName].data === null) return 0;
		const value = parseFloat(harvardObj[fieldName].data);
		return isNaN(value) ? 0 : value;
	};

	// Prepare line chart data
	const getLineData = () => {
		if (!data?.games) return [];

		const validGames = data.games.filter(g => g.harvard && Object.keys(g.harvard).length > 0);

		// Filter games by season
		const filteredGames = validGames.filter(game => {
			if (seasonFilter === 'both') return true;
			const season =
				game.season ||
				(game.features && game.features[0]?.properties?.season) ||
				'';
			return season.toLowerCase() === seasonFilter;
		});

		const allYears = Array.from(new Set(filteredGames.map(game => game.year))).sort((a, b) => a - b);

		return SERIES_FIELDS
			.filter(field => visibleSeries[field.key])
			.map(field => {
				let color = field.color;
				if (seasonFilter === 'winter') color = field.winter_color;
				return {
					id: field.label,
					color,
					data: allYears.map(year => {
						const game = filteredGames.find(g => g.year === year);
						let y = 0;
						let location = '';
						if (game) {
							const value = getFieldValue(game.harvard, field.key);
							y = value !== null ? value : 0;
							location = game.location;
						}
						return { x: year, y, location };
					}),
				};
			});
	};

	// Toggle series visibility
	const handleToggleSeries = key => {
		setVisibleSeries(prev => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	// Add this helper function above your return statement
	const getXAxisTicks = () => {
		const years = lineData.length > 0 ? lineData[0].data.map(d => d.x) : [];
		if (seasonFilter === 'summer') {
			// 4-year steps starting at 1964
			return years.filter(y => (y - 1964) % 4 === 0);
		}
		if (seasonFilter === 'winter') {
			// 4-year steps starting at 1964, then after 1992 switch to 2-year steps, with "..." between 1992 and 1994
			const ticks = [];
			let switched = false;
			for (let i = 0; i < years.length; i++) {
				const y = years[i];
				if (!switched) {
					if ((y - 1964) % 4 === 0) {
						ticks.push(y);
						if (y === 1992 && years[i + 1] === 1994) {
							ticks.push('...');
							switched = true;
						}
					}
				} else {
					// After 1992, show every 2 years
					if ((y - 1994) % 2 === 0 && y >= 1994) {
						ticks.push(y);
					}
				}
			}
			return ticks;
		}
		// Both: show every 2 years
		const minYear = Math.min(...years, 1964);
		return years.filter(y => (y - minYear) % 2 === 0);
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

	const lineData = getLineData();

	// Get year range for x axis
	const getYearRange = () => {
		if (!data?.games) return { min: 'auto', max: 'auto' };
		const validGames = data.games.filter(game => Array.isArray(game.harvard) && game.harvard.length > 0);
		if (validGames.length === 0) return { min: 'auto', max: 'auto' };
		const years = validGames.map(game => game.year);
		return {
			min: Math.min(...years),
			max: Math.max(...years),
		};
	};

	return (
		<div className="space-y-8">
			<SectionHeader headline={"Cost Analysis"}
				description={"Analyze the financial aspects of the Olympic Games, including revenue streams and costs associated with hosting the event."}
			/>
			<div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
				{/* Series Toggle Buttons */}
				<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 flex flex-wrap gap-2 justify-between items-center">
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 w-full">
							Show/Hide Series
						</label>
						<div className="flex flex-wrap gap-2">
							{SERIES_FIELDS.map(field => (
								<button
									key={field.key}
									onClick={() => handleToggleSeries(field.key)}
									className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1
										${visibleSeries[field.key] ? 'text-white' : 'text-gray-700 dark:text-gray-300'}
									`}
									style={{
										backgroundColor: visibleSeries[field.key] ? field.color : '#e5e7eb',
										border: `2px solid ${field.color}`,
										opacity: visibleSeries[field.key] ? 1 : 0.5,
										transition: 'background 0.2s, color 0.2s, box-shadow 0.2s'
									}}
									onMouseEnter={e => {
										e.currentTarget.style.backgroundColor = field.color;
										e.currentTarget.style.color = '#fff';
										e.currentTarget.style.boxShadow = `0 0 0 3px ${field.color}55`;
									}}
									onMouseLeave={e => {
										e.currentTarget.style.backgroundColor = visibleSeries[field.key] ? field.color : '#e5e7eb';
										e.currentTarget.style.color = visibleSeries[field.key] ? '#fff' : '';
										e.currentTarget.style.boxShadow = 'none';
									}}
								>
									{field.label}
									{visibleSeries[field.key] ? (
										<span className="ml-1">✓</span>
									) : (
										<span className="ml-1">✗</span>
									)}
								</button>
							))}
						</div>
					</div>
					{/* Olympic Season Selector (right) */}
					<div>
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
				</div>

				{/* Line Chart */}
				<div className="h-96 chart-container">
					<style jsx>{`
						.chart-container :global(text) {
							fill: #d1d5db !important;
							font-weight: 600 !important;
						}
					`}</style>
					<ResponsiveLine
						data={lineData}
						margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
						xScale={{ type: 'linear', min: getYearRange().min, max: getYearRange().max }}
						yScale={{ type: 'linear', min: 0, max: 'auto' }}
						axisTop={null}
						axisRight={null}
						axisBottom={{
							orient: 'bottom',
							tickSize: 5,
							tickPadding: 5,
							tickRotation: 0,
							legend: 'Year',
							legendOffset: 36,
							legendPosition: 'middle',
							tickValues: getXAxisTicks(),
							format: value => value === '...' ? '...' : value,
						}}
						axisLeft={{
							orient: 'left',
							tickSize: 5,
							tickPadding: 5,
							tickRotation: 0,
							legend: 'USD (2018, millions)',
							legendOffset: -50,
							legendPosition: 'middle',
							format: value => `${(value / 1_000_000).toLocaleString()}M`
						}}
						colors={series => series.color}
						pointSize={8}
						enablePoints={true}
						pointColor={{ theme: 'background' }}
						pointBorderWidth={2}
						pointBorderColor={{ from: 'serieColor' }}
						useMesh={true}
						enableArea={false}
						legends={[
							{
								anchor: 'bottom-right',
								direction: 'column',
								justify: false,
								translateX: 30,
								translateY: 0,
								itemsSpacing: 4,
								itemDirection: 'left-to-right',
								itemWidth: 180,
								itemHeight: 20,
								itemOpacity: 1,
								symbolSize: 16,
								symbolShape: 'circle',
								symbolBorderColor: 'rgba(0, 0, 0, .5)',
								data: SERIES_FIELDS
									.filter(field => visibleSeries[field.key])
									.map(field => ({
										id: field.label,
										label: field.label,
										color: seasonFilter === 'winter' ? field.winter_color : field.color,
									})),
							},
						]}
						tooltip={({ point }) => (
							<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
								<div className="font-bold text-gray-900 dark:text-gray-100 mb-1">
									{point.data.location} {point.data.x}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
									{point.serieId}
								</div>
								<div className="flex justify-between">
									<span className="font-medium text-gray-700 dark:text-gray-300">USD (2018): </span>
									<span className="text-gray-900 dark:text-gray-100">
										{point.data.y?.toLocaleString()}
									</span>
								</div>
							</div>
						)}
					/>
				</div>
			</div>
		</div>
	);
};

export default CostAnalysis;