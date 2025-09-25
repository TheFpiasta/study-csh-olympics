'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../../components/LoadingSpinner';

const LongTermSankeyPlot = ({ geojsonData }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonFilter, setSeasonFilter] = useState('summer'); // default
  const [selectedGame, setSelectedGame] = useState(null);

  const wrapperRef = useRef(null);


  useEffect(() => {
    if (!geojsonData) return;
    setLoading(false);
    setData(geojsonData.data);
    setError(geojsonData.error || null);
  }, [geojsonData]);

  const getFilteredGames = () => {
    if (!data?.games) return [];
    return data.games.filter((game) => {
      const season = game.season || game.features?.[0]?.properties?.season || '';
      return season.toLowerCase() === seasonFilter;
    });
  };

  const filteredGames = getFilteredGames();

  useEffect(() => {
    if (filteredGames.length > 0) {
      setSelectedGame(filteredGames[filteredGames.length - 1]); // default to last game in filtered list
    } else {
      setSelectedGame(null);
    }
  }, [seasonFilter, data]);

  const buildSankeyData = (game) => {
    if (!game) return { nodes: [], links: [] };

    const sankeyData = { nodes: [], links: [] };
      const nodeStats = {};

    game.features.forEach((feature) => {
      const classification = feature.properties?.classification;
      const status = feature.properties?.status;
      let venueName = 'Unknown Venue';

      const names = feature.properties?.associated_names || [];
      for (let name of names) {
        if (name && name.trim() !== '') {
          venueName = name;
          break; // stop at first non-empty name
        }
      }

      if (!classification || !status) return;

        // Track node statistics
        if (!nodeStats[classification]) {
            nodeStats[classification] = {
                type: 'classification',
                venues: [],
                totalCapacity: 0,
                sports: new Set(),
                venueTypes: new Set()
            };
        }
        if (!nodeStats[status]) {
            nodeStats[status] = {
                type: 'status',
                venues: [],
                totalCapacity: 0,
                sports: new Set(),
                venueTypes: new Set()
            };
        }

        // Collect venue details
        const venueInfo = {
            name: venueName,
            capacity: parseInt(feature.properties?.seating_capacity) || 0,
            sports: feature.properties?.sports || [],
            type: feature.properties?.type || 'Unknown',
            location: feature.properties?.location || '',
            opened: feature.properties?.opened || ''
        };

        nodeStats[classification].venues.push(venueInfo);
        nodeStats[status].venues.push(venueInfo);

        nodeStats[classification].totalCapacity += venueInfo.capacity;
        nodeStats[status].totalCapacity += venueInfo.capacity;

        const sports = Array.isArray(venueInfo.sports) ? venueInfo.sports : [venueInfo.sports];
        sports.forEach(sport => {
            if (sport) {
                nodeStats[classification].sports.add(sport);
                nodeStats[status].sports.add(sport);
            }
        });

        nodeStats[classification].venueTypes.add(venueInfo.type);
        nodeStats[status].venueTypes.add(venueInfo.type);

        // Create nodes with stats
      if (!sankeyData.nodes.find((n) => n.id === classification)) {
          sankeyData.nodes.push({
              id: classification,
              ...nodeStats[classification]
          });
      }
      if (!sankeyData.nodes.find((n) => n.id === status)) {
          sankeyData.nodes.push({
              id: status,
              ...nodeStats[status]
          });
      }

      sankeyData.links.push({
        source: classification,
        target: status,
        value: 1,
          venue: venueInfo,
      });
    });

      // Update node stats after all venues are processed
      sankeyData.nodes.forEach(node => {
          const stats = nodeStats[node.id];
          if (stats) {
              node.venues = stats.venues;
              node.totalCapacity = stats.totalCapacity;
              node.sports = Array.from(stats.sports);
              node.venueTypes = Array.from(stats.venueTypes);
              node.type = stats.type;
          }
      });

    return sankeyData;
  };

  const RemoveNativeTitlesLayer = () => {
    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      const svg = el.querySelector('svg');
      if (!svg) return;
      svg.querySelectorAll('title').forEach((t) => t.remove());
    });
    return null;
  };

  const brightPalette = [
    '#FF0000', // Olympic Red
    '#0000FF', // Olympic Blue
    '#FFFF00', // Olympic Yellow
    '#00A651', // Olympic Green
    '#FFA500', // Orange – energetic, visible on dark
    '#800080', // Purple – rich, celebratory
    '#00CED1', // Cyan/Teal – vibrant and bright
    '#FF69B4', // Hot pink – festive accent
  ];


  if (loading) return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  if (error)
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-300">Error loading data: {error}</p>
      </div>
    );
  if (!data?.games?.length)
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-300">No capacity data available</p>
      </div>
    );

  const sankeyData = selectedGame ? buildSankeyData(selectedGame) : null;

  return (
    <div className="space-y-6" ref={wrapperRef}>
      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
          {/* Olympic Season Filter */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Olympic Season
              </label>
              <div className="flex flex-wrap gap-2">
                  {['summer', 'winter'].map((season) => (
                      <button
                          key={season}
                          onClick={() => setSeasonFilter(season)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              seasonFilter === season
                                  ? season === 'summer'
                                      ? 'bg-amber-500 text-white'
                                      : 'bg-cyan-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                      >
                          {season.charAt(0).toUpperCase() + season.slice(1)}
                      </button>
                  ))}
              </div>
          </div>

          {/* Select Olympic Games Filter */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Olympic Games
              </label>
              <select
                  value={selectedGame?.year || ''}
                  onChange={(e) => {
                      const chosen = filteredGames.find((g) => g.year.toString() === e.target.value);
                      setSelectedGame(chosen);
                  }}
                  className="w-48 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                  {filteredGames.map((game) => (
                      <option key={game.year} value={game.year}>
                          {game.year} {game.location}
                      </option>
                  ))}
              </select>
        </div>

          <div className="h-96 ml-50 mr-20">
          {sankeyData ? (
            <ResponsiveSankey
              data={sankeyData}
              margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
              align="justify"
              colors={brightPalette}
              layers={['links', 'nodes', 'labels', RemoveNativeTitlesLayer]}
              nodeOpacity={1}
              nodeHoverOthersOpacity={0.35}
              nodeBorderWidth={2}
              nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.5]] }}
              linkOpacity={0.7}
              linkHoverOthersOpacity={0.15}
              linkContract={0.5}
              labelTextColor= "#ffffff"
              enableLinkGradient={true}
              nodeTooltip={({node}) => (
                  <div
                      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-64 max-w-80">
                      <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">
                          {node.id}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {node.type === 'classification' ? 'Build Classification' : 'Current Status'}
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Total Venues:</span>
                              <span className="text-gray-900 dark:text-gray-100">{node.venues?.length || 0}</span>
                          </div>
                          {node.totalCapacity > 0 && (
                              <div className="flex justify-between">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Total Capacity:</span>
                                  <span className="text-gray-900 dark:text-gray-100">
                          {node.totalCapacity.toLocaleString()}
                        </span>
                              </div>
                          )}
                          <div className="flex justify-between">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Sports:</span>
                              <span className="text-gray-900 dark:text-gray-100">{node.sports?.length || 0}</span>
                          </div>
                          {node.venueTypes && node.venueTypes.length > 0 && (
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Venue Types:
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {node.venueTypes.join(', ')}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              )}
              linkTooltip={({ link }) => {
                  const venue = link?.venue || {};
                  const venueName = typeof venue === 'string' ? venue : venue.name || 'Unknown Venue';
                const from = typeof link.source === 'object' ? link.source.id : link.source;
                const to = typeof link.target === 'object' ? link.target.id : link.target;

                return (
                    <div
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-64 max-w-80">
                        <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-2">
                            {venueName}
                    </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Venue Flow: {from} → {to}
                        </div>
                        <div className="space-y-2">
                            {venue.capacity > 0 && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Capacity:</span>
                                    <span className="text-gray-900 dark:text-gray-100">
                            {venue.capacity.toLocaleString()}
                          </span>
                                </div>
                            )}
                            {venue.type && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                                    <span className="text-gray-900 dark:text-gray-100">{venue.type}</span>
                                </div>
                            )}
                            {venue.sports && venue.sports.length > 0 && (
                                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Sports:
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {Array.isArray(venue.sports) ? venue.sports.join(', ') : venue.sports}
                                    </div>
                                </div>
                            )}
                            {venue.location && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>
                                    <span className="text-gray-900 dark:text-gray-100 text-sm">{venue.location}</span>
                                </div>
                            )}
                            {venue.opened && (
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Opened:</span>
                                    <span className="text-gray-900 dark:text-gray-100">{venue.opened}</span>
                                </div>
                            )}
                    </div>
                  </div>
                );
              }}
            />
          ) : (
            <div className="p-4 text-gray-400">No game selected</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LongTermSankeyPlot;
