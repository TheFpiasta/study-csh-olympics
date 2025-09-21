'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';
import SectionHeader from '@/app/graphs/components/templates/SectionHeader';
import LoadingSpinner from '../../../components/LoadingSpinner';

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
      setSelectedGame(filteredGames[0]);
    } else {
      setSelectedGame(null);
    }
  }, [seasonFilter, data]);

  const buildSankeyData = (game) => {
    if (!game) return { nodes: [], links: [] };

    const sankeyData = { nodes: [], links: [] };

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

      if (!sankeyData.nodes.find((n) => n.id === classification)) {
        sankeyData.nodes.push({ id: classification });
      }
      if (!sankeyData.nodes.find((n) => n.id === status)) {
        sankeyData.nodes.push({ id: status });
      }

      sankeyData.links.push({
        source: classification,
        target: status,
        value: 1,
        venue: venueName,
      });
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
      <SectionHeader
        headline="Venue Capacity Distribution"
        description="Sankey diagram showing classification → status flows of Olympic venues, with venue names."
      />

      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Olympic Season</label>
            <div className="flex gap-2">
              {['summer', 'winter'].map((season) => (
                <button
                  key={season}
                  onClick={() => setSeasonFilter(season)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    seasonFilter === season ? 'bg-violet-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Select Olympic Games</label>
            <select
              value={selectedGame?.year || ''}
              onChange={(e) => {
                const chosen = filteredGames.find((g) => g.year.toString() === e.target.value);
                setSelectedGame(chosen);
              }}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm"
            >
              {filteredGames.map((game) => (
                <option key={game.year} value={game.year}>
                  {game.year} {game.location}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-96">
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
              labelTextColor= "#ffffff"
              enableLinkGradient={true}
              linkTooltip={({ link }) => {
                const venue = link?.venue ?? 'Unknown Venue';
                const from = typeof link.source === 'object' ? link.source.id : link.source;
                const to = typeof link.target === 'object' ? link.target.id : link.target;

                return (
                  <div className="bg-gray-800 text-white p-3 rounded-lg shadow-xl border border-gray-600 text-sm">
                    <div className="font-bold mb-2">{venue}</div>
                    <div className="flex justify-between text-sm">
                      <span>From: </span>
                      <span>{from}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>To: </span>
                      <span>{to}</span>
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
