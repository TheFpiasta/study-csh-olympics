'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { ResponsiveNetwork } from '@nivo/network';
import { ResponsiveSankey } from '@nivo/sankey';
import LoadingSpinner from '../../../components/LoadingSpinner';
import logger from '@/components/logger';

const InteractiveFeatures = ({geojsonData}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSports, setSelectedSports] = useState(new Set(['All']));
  const [selectedSeasons, setSelectedSeasons] = useState(new Set(['All']));
  const [yearRange, setYearRange] = useState([1896, 2018]);

    useEffect(() => {
        if (!geojsonData ) return;

        setLoading(false);
        setData(geojsonData.data);
        setError(geojsonData.error);

        // Set initial year range based on actual data
        if (geojsonData.data.games && geojsonData.data.games.length > 0) {
            const years = geojsonData.data.games.map(game => game.year);
            setYearRange([Math.min(...years), Math.max(...years)]);
        }
    }, [geojsonData]);

  // Get all unique sports and seasons for filtering
  const getFilters = () => {
    if (!data?.games) return { sports: [], seasons: [] };
    
    const allSports = new Set();
    const allSeasons = new Set();
    
    data.games.forEach(game => {
      game.features.forEach(feature => {
        if (feature.properties.season) {
          allSeasons.add(feature.properties.season);
        }
        if (feature.properties.sports) {
          if (Array.isArray(feature.properties.sports)) {
            feature.properties.sports.forEach(sport => allSports.add(sport));
          } else {
            allSports.add(feature.properties.sports);
          }
        }
      });
    });
    
    return {
      sports: Array.from(allSports).sort(),
      seasons: Array.from(allSeasons).sort()
    };
  };

  // Process data for scatter plot
  const getScatterPlotData = () => {
    if (!data?.games) return [];
    
    const sportCategories = new Map();
    
    // Olympic theme colors for different sports/categories
    const colors = ['#0081C8', '#FCB131', '#00A651', '#EE334E', '#FF6B35', '#8E44AD', '#2ECC71', '#E74C3C', '#3498DB', '#F39C12', '#9B59B6', '#1ABC9C'];
    let colorIndex = 0;
    
    data.games.forEach(game => {
      // Filter by year range
      if (game.year < yearRange[0] || game.year > yearRange[1]) return;
      
      game.features.forEach(feature => {
        const props = feature.properties;
        
        // Filter by season at feature level
        if (!selectedSeasons.has('All') && !selectedSeasons.has(props.season)) return;
        
        // Extract capacity (try different property names that might contain capacity info)
        let capacity = null;
        if (props.capacity) {
          capacity = parseInt(props.capacity.toString().replace(/[^\d]/g, ''));
        } else if (props.seating_capacity) {
          capacity = parseInt(props.seating_capacity.toString().replace(/[^\d]/g, ''));
        } else if (props.max_capacity) {
          capacity = parseInt(props.max_capacity.toString().replace(/[^\d]/g, ''));
        }
        
        // Skip venues without capacity data
        if (!capacity || capacity === 0) return;
        
        // Get sports for this venue
        let venueSports = [];
        if (props.sports) {
          venueSports = Array.isArray(props.sports) ? props.sports : [props.sports];
        }
        
        // Filter by selected sports
        if (!selectedSports.has('All')) {
          const hasSelectedSport = venueSports.some(sport => selectedSports.has(sport));
          if (!hasSelectedSport) return;
        }
        
        // Group by primary sport (first sport in the list, or 'Multi-Sport' if multiple)
        let primarySport = venueSports.length > 0 ? venueSports[0] : 'Unknown';
        if (venueSports.length > 3) {
          primarySport = 'Multi-Sport Complex';
        }
        
        if (!sportCategories.has(primarySport)) {
          sportCategories.set(primarySport, {
            id: primarySport,
            data: [],
            color: colors[colorIndex % colors.length]
          });
          colorIndex++;
        }
        
        sportCategories.get(primarySport).data.push({
          x: game.year,
          y: capacity,
          venue: props.associated_names ? props.associated_names[0] : 'Unknown Venue',
          location: game.location,
          season: props.season,
          sports: venueSports.join(', '),
          size: Math.log10(capacity) * 2 // Size based on capacity (logarithmic scale)
        });
      });
    });
    
    return Array.from(sportCategories.values()).filter(category => category.data.length > 0);
  };

  // Process data for network graph
  const getNetworkData = () => {
    if (!data?.games) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const cityVenues = new Map(); // Track venues per city
    const venueDetails = new Map(); // Track venue details
    
    // Helper function to add node if not exists
    const addNode = (id, label, type, size = 10, color = '#8B5CF6', details = {}) => {
      if (!nodeMap.has(id)) {
        const node = { id, label, type, size, color, ...details };
        nodes.push(node);
        nodeMap.set(id, node);
      }
      return nodeMap.get(id);
    };
    
    // Helper function to add link
    const addLink = (source, target, value = 1, distance = 80) => {
      const existingLink = links.find(l => l.source === source && l.target === target);
      if (existingLink) {
        existingLink.value += value;
      } else {
        links.push({ 
          source, 
          target, 
          value: Math.max(1, value || 1),
          distance: distance
        });
      }
    };
    
    // Add central Olympics node
    addNode('olympics', 'Olympics', 'center', 40, '#FFD700'); // Gold

      logger.info('Processing games:', data.games.length);
    
    // First pass: collect all venues and their details
    data.games.forEach(game => {
      // Filter by year range
      if (game.year < yearRange[0] || game.year > yearRange[1]) return;
      
      const cityName = game.location;
      
      if (!cityVenues.has(cityName)) {
        cityVenues.set(cityName, []);
      }

        logger.info(`Processing ${cityName} (${game.year}) with ${game.features.length} features`);
      
      game.features.forEach(feature => {
        const props = feature.properties;
        
        // Filter by season at feature level
        if (!selectedSeasons.has('All') && !selectedSeasons.has(props.season)) return;
        
        // Get clean venue name
        let venueName = 'Unknown Venue';
        if (props.associated_names && props.associated_names[0]) {
          venueName = props.associated_names[0];
        }
        
        // Get sports for this venue
        let venueSports = [];
        if (props.sports) {
          venueSports = Array.isArray(props.sports) ? props.sports : [props.sports];
        }
        
        // Filter by selected sports
        if (!selectedSports.has('All')) {
          const hasSelectedSport = venueSports.some(sport => selectedSports.has(sport));
          if (!hasSelectedSport) return;
        }
        
        // Get capacity
        let capacity = null;
        if (props.capacity) {
          capacity = parseInt(props.capacity.toString().replace(/[^\d]/g, ''));
        }
        
        const venueKey = `${venueName}_${cityName}_${game.year}`;
        
        venueDetails.set(venueKey, {
          name: venueName,
          city: cityName,
          year: game.year,
          sports: venueSports,
          capacity: capacity,
          season: props.season
        });
        
        cityVenues.get(cityName).push(venueKey);
      });
    });

      logger.info('Cities found:', cityVenues.size);
      logger.info('Venues found:', venueDetails.size);
    
    // Second pass: create nodes and links
    cityVenues.forEach((venueKeys, cityName) => {
      if (venueKeys.length === 0) return;
      
      const cityId = cityName.replace(/[^a-zA-Z0-9]/g, '_');
      const citySize = Math.max(20, Math.min(35, 18 + venueKeys.length));
      
      // Add city node
      addNode(cityId, cityName, 'city', citySize, '#FF6B35'); // Orange for cities
      
      // Connect Olympics to city
      addLink('olympics', cityId, venueKeys.length, 120);
      
      // Process venues for this city
      venueKeys.forEach(venueKey => {
        const venue = venueDetails.get(venueKey);
        if (!venue) return;
        
        const venueId = venueKey.replace(/[^a-zA-Z0-9]/g, '_');
        let venueSize = 15;
        
        if (venue.capacity && venue.capacity > 0) {
          venueSize = Math.max(12, Math.min(28, Math.log10(venue.capacity) * 3));
        }
        
        // Add venue node
        addNode(venueId, venue.name, 'venue', venueSize, '#2ECC71', { // Green for venues
          capacity: venue.capacity,
          year: venue.year,
          season: venue.season
        });
        
        // Connect city to venue
        addLink(cityId, venueId, 1, 80);
        
        // Add sports and connect to venue
        venue.sports.forEach(sport => {
          const sportId = sport.replace(/[^a-zA-Z0-9]/g, '_');
          addNode(sportId, sport, 'sport', 14, '#3498DB'); // Blue for sports
          addLink(venueId, sportId, 1, 50);
        });
      });
    });

      logger.info('Final nodes:', nodes.length);
      logger.info('Final links:', links.length);
    
    // Performance limiting - keep most connected nodes
    if (nodes.length > 200) {
      // Calculate connection counts
      const connectionCounts = new Map();
      links.forEach(link => {
        connectionCounts.set(link.source, (connectionCounts.get(link.source) || 0) + 1);
        connectionCounts.set(link.target, (connectionCounts.get(link.target) || 0) + 1);
      });
      
      // Always keep Olympics
      const olympics = nodes.filter(n => n.type === 'center');
      
      // Keep top cities (most venues)
      const cities = nodes.filter(n => n.type === 'city')
        .sort((a, b) => b.size - a.size)
        .slice(0, 25);
      
      const cityIds = new Set([...olympics.map(n => n.id), ...cities.map(n => n.id)]);
      
      // Keep venues connected to kept cities
      const venues = nodes.filter(n => n.type === 'venue' && 
        links.some(l => cityIds.has(l.source) && l.target === n.id))
        .sort((a, b) => (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0))
        .slice(0, 80);
      
      const venueIds = new Set(venues.map(n => n.id));
      
      // Keep sports connected to kept venues
      const sports = nodes.filter(n => n.type === 'sport' && 
        links.some(l => venueIds.has(l.source) && l.target === n.id))
        .sort((a, b) => (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0))
        .slice(0, 60);
      
      const keptNodes = [...olympics, ...cities, ...venues, ...sports];
      const keptNodeIds = new Set(keptNodes.map(n => n.id));
      const filteredLinks = links.filter(l => keptNodeIds.has(l.source) && keptNodeIds.has(l.target));

        logger.info('Filtered to:', keptNodes.length, 'nodes and', filteredLinks.length, 'links');
      
      return { nodes: keptNodes, links: filteredLinks };
    }
    
    return { nodes, links };
  };

  // Process data for Sankey diagram (Olympic venue evolution and usage patterns)
  const getSankeyData = () => {
    if (!data?.games) return { nodes: [], links: [] };
    
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Helper to add unique nodes
    const addNode = (id, label, category) => {
      if (!nodeMap.has(id)) {
        const node = { id, label, category };
        nodes.push(node);
        nodeMap.set(id, node);
      }
    };
    
    // Helper to add or update links
    const addLink = (source, target, value) => {
      const existingLink = links.find(l => l.source === source && l.target === target);
      if (existingLink) {
        existingLink.value += value;
      } else {
        links.push({ source, target, value });
      }
    };
    
    // Track venue categorization
    const eraToVenueType = new Map();
    const venueTypeToSports = new Map();
    const sportsToSeason = new Map();
    
    // Process all Olympic games to understand venue evolution
    data.games.forEach(game => {
      // Filter by year range
      if (game.year < yearRange[0] || game.year > yearRange[1]) return;
      
      game.features.forEach(feature => {
        const props = feature.properties;
        
        // Filter by season at feature level
        if (!selectedSeasons.has('All') && !selectedSeasons.has(props.season)) return;
        
        // Get venue sports
        let venueSports = [];
        if (props.sports) {
          venueSports = Array.isArray(props.sports) ? props.sports : [props.sports];
        }
        
        // Filter by selected sports
        if (!selectedSports.has('All')) {
          const hasSelectedSport = venueSports.some(sport => selectedSports.has(sport));
          if (!hasSelectedSport) return;
        }
        
        // Determine construction era
        let constructionEra = 'Unknown Era';
        if (props.opened) {
          const openedYear = parseInt(props.opened);
          if (!isNaN(openedYear)) {
            if (openedYear < 1900) {
              constructionEra = 'Pre-1900 Era';
            } else if (openedYear < 1950) {
              constructionEra = '1900-1950 Era';
            } else if (openedYear < 1980) {
              constructionEra = '1950-1980 Era';
            } else {
              constructionEra = 'Modern Era (1980+)';
            }
          }
        } else {
          // If no opening date, infer from Olympic year
          if (game.year < 1950) {
            constructionEra = 'Early Olympic Era';
          } else {
            constructionEra = 'Modern Olympic Era';
          }
        }
        
        // Get venue type (indoor vs outdoor)
        let venueType = 'Mixed Venue';
        if (props.type) {
          if (props.type.toLowerCase().includes('indoor')) {
            venueType = 'Indoor Venue';
          } else if (props.type.toLowerCase().includes('outdoor')) {
            venueType = 'Outdoor Venue';
          }
        }
        
        // Categorize sports into broader groups
        venueSports.forEach(sport => {
          let sportCategory = 'Other Sports';
          const sportLower = sport.toLowerCase();
          
          if (sportLower.includes('skating') || sportLower.includes('hockey') || sportLower.includes('curling')) {
            sportCategory = 'Ice Sports';
          } else if (sportLower.includes('skiing') || sportLower.includes('biathlon') || sportLower.includes('nordic') || sportLower.includes('alpine')) {
            sportCategory = 'Snow Sports';
          } else if (sportLower.includes('athletics') || sportLower.includes('track') || sportLower.includes('field') || sportLower.includes('running') || sportLower.includes('jumping')) {
            sportCategory = 'Athletics';
          } else if (sportLower.includes('swimming') || sportLower.includes('diving') || sportLower.includes('water') || sportLower.includes('aquatic')) {
            sportCategory = 'Aquatic Sports';
          } else if (sportLower.includes('football') || sportLower.includes('soccer') || sportLower.includes('basketball') || sportLower.includes('volleyball') || sportLower.includes('handball')) {
            sportCategory = 'Team Ball Sports';
          } else if (sportLower.includes('gymnastics') || sportLower.includes('wrestling') || sportLower.includes('boxing') || sportLower.includes('judo') || sportLower.includes('fencing')) {
            sportCategory = 'Combat & Gymnastics';
          } else if (sportLower.includes('ceremony')) {
            sportCategory = 'Ceremonies';
          } else if (sportLower.includes('cycling') || sportLower.includes('rowing') || sportLower.includes('sailing') || sportLower.includes('equestrian')) {
            sportCategory = 'Endurance & Technical';
          }
          
          // Determine season preference
          let seasonType = props.season + ' Sports';
          
          // Track relationships
          if (!eraToVenueType.has(constructionEra)) {
            eraToVenueType.set(constructionEra, new Map());
          }
          eraToVenueType.get(constructionEra).set(venueType, 
            (eraToVenueType.get(constructionEra).get(venueType) || 0) + 1);
          
          if (!venueTypeToSports.has(venueType)) {
            venueTypeToSports.set(venueType, new Map());
          }
          venueTypeToSports.get(venueType).set(sportCategory,
            (venueTypeToSports.get(venueType).get(sportCategory) || 0) + 1);
          
          if (!sportsToSeason.has(sportCategory)) {
            sportsToSeason.set(sportCategory, new Map());
          }
          sportsToSeason.get(sportCategory).set(seasonType,
            (sportsToSeason.get(sportCategory).get(seasonType) || 0) + 1);
        });
      });
    });
    
    // Create flow structure: Construction Era → Venue Type → Sports Category → Season Type
    
    // Add construction era nodes and links to venue types
    eraToVenueType.forEach((venueMap, era) => {
      addNode(era, era, 'era');
      
      venueMap.forEach((count, venueType) => {
        addNode(venueType, venueType, 'venue_type');
        addLink(era, venueType, count);
      });
    });
    
    // Add sports category nodes and links
    venueTypeToSports.forEach((sportsMap, venueType) => {
      sportsMap.forEach((count, sportCategory) => {
        addNode(sportCategory, sportCategory, 'sport_category');
        addLink(venueType, sportCategory, count);
      });
    });
    
    // Add season type nodes and links
    sportsToSeason.forEach((seasonMap, sportCategory) => {
      seasonMap.forEach((count, seasonType) => {
        addNode(seasonType, seasonType, 'season');
        addLink(sportCategory, seasonType, count);
      });
    });

      logger.info('Sankey nodes:', nodes.length);
      logger.info('Sankey links:', links.length);
      logger.info('Era data:', Array.from(eraToVenueType.keys()));
    
    return { nodes, links };
  };

  const filters = getFilters();
  const scatterData = getScatterPlotData();
  const networkData = getNetworkData();
  const sankeyData = getSankeyData();

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-600/20 dark:to-purple-600/20 border border-violet-200 dark:border-violet-700 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
            🎯 Interactive Features
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Multi-dimensional Analysis
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Multi-dimensional analysis: scatter plots, network graphs, and venue usage flow diagrams with interactive filtering
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Year Range Slider */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Year Range: {yearRange[0]} - {yearRange[1]}
          </label>
          <div className="flex gap-4">
            <input
              type="range"
              min="1896"
              max="2018"
              value={yearRange[0]}
              onChange={(e) => setYearRange([parseInt(e.target.value), yearRange[1]])}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <input
              type="range"
              min="1896"
              max="2018"
              value={yearRange[1]}
              onChange={(e) => setYearRange([yearRange[0], parseInt(e.target.value)])}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Season Filter */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Olympic Season
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSeasons(new Set(['All']))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSeasons.has('All')
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Seasons
            </button>
            {filters.seasons.map(season => (
              <button
                key={season}
                onClick={() => {
                  const newSelection = new Set(selectedSeasons);
                  newSelection.delete('All');
                  if (newSelection.has(season)) {
                    newSelection.delete(season);
                    if (newSelection.size === 0) newSelection.add('All');
                  } else {
                    newSelection.add(season);
                  }
                  setSelectedSeasons(newSelection);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedSeasons.has(season) && !selectedSeasons.has('All')
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>

        {/* Sports Filter */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sports Filter (showing top 20 sports)
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            <button
              onClick={() => setSelectedSports(new Set(['All']))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedSports.has('All')
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All Sports
            </button>
            {filters.sports.slice(0, 20).map(sport => (
              <button
                key={sport}
                onClick={() => {
                  const newSelection = new Set(selectedSports);
                  newSelection.delete('All');
                  if (newSelection.has(sport)) {
                    newSelection.delete(sport);
                    if (newSelection.size === 0) newSelection.add('All');
                  } else {
                    newSelection.add(sport);
                  }
                  setSelectedSports(newSelection);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedSports.has(sport) && !selectedSports.has('All')
                    ? 'bg-fuchsia-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scatter Plot */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 h-96 relative">
        {scatterData.length > 0 ? (
          <ResponsiveScatterPlot
            data={scatterData}
            margin={{ top: 20, right: 100, bottom: 60, left: 80 }}
            xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            yScale={{ type: 'log', min: 100, max: 'auto' }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              orient: 'bottom',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Year',
              legendPosition: 'middle',
              legendOffset: 45
            }}
            axisLeft={{
              orient: 'left',
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Venue Capacity (log scale)',
              legendPosition: 'middle',
              legendOffset: -60,
              format: value => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }
            }}
            nodeSize={d => Math.max(8, Math.min(20, d.size * 1.5 || 10))}
            colors={['#8B5CF6', '#A855F7', '#C084FC', '#D8B4FE', '#E879F9', '#F0ABFC', '#F472B6', '#FB7185', '#F87171', '#FBBF24', '#34D399', '#60A5FA']}
            enableGridX={true}
            enableGridY={true}
            useMesh={true}
            tooltip={({ node }) => (
              <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-w-xs w-80">
                <div className="space-y-2">
                  <div className="font-bold text-lg text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 pb-2">
                    {node.data.venue}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>
                      <div className="text-gray-600 dark:text-gray-400">{node.data.location}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Year:</span>
                      <div className="text-gray-600 dark:text-gray-400">{node.data.x}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Capacity:</span>
                      <div className="text-gray-600 dark:text-gray-400 font-mono">{node.data.y.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Season:</span>
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          node.data.season === 'Summer' 
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {node.data.season}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Sports:</span>
                    <div className="text-gray-600 dark:text-gray-400 mt-1 text-sm leading-relaxed">
                      {node.data.sports}
                    </div>
                  </div>
                </div>
              </div>
            )}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemWidth: 80,
                itemHeight: 20,
                itemsSpacing: 5,
                itemDirection: 'left-to-right',
                symbolSize: 8,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            theme={{
              background: 'transparent',
              text: {
                fill: '#374151',
                fontSize: 11
              },
              axis: {
                domain: {
                  line: {
                    stroke: '#6B7280',
                    strokeWidth: 1
                  }
                },
                legend: {
                  text: {
                    fill: '#374151',
                    fontSize: 12,
                    fontWeight: 600
                  }
                },
                ticks: {
                  line: {
                    stroke: '#6B7280',
                    strokeWidth: 1
                  },
                  text: {
                    fill: '#6B7280',
                    fontSize: 10
                  }
                }
              },
              grid: {
                line: {
                  stroke: '#E5E7EB',
                  strokeWidth: 1,
                  strokeOpacity: 0.5
                }
              },
              legends: {
                text: {
                  fill: '#374151',
                  fontSize: 10
                }
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No data available for the selected filters</p>
          </div>
        )}
      </div>

      {/* Network Graph Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            🕸️ Olympic Network Analysis
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Hierarchical view: Olympics → Cities → Venues → Sports
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 h-96">
          {networkData.nodes.length > 0 ? (
            <ResponsiveNetwork
              data={networkData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              linkDistance={function(e){return e.distance || 80}}
              centeringStrength={0.8}
              repulsivity={8}
              iterations={120}
              nodeSize={d => Math.max(6, Math.min(35, d.size || 12))}
              activeNodeSize={d => Math.max(8, Math.min(45, (d.size || 12) * 1.3))}
              inactiveNodeSize={d => Math.max(4, Math.min(25, (d.size || 12) * 0.9))}
              nodeColor={d => d.color || '#8B5CF6'}
              nodeBorderWidth={1}
              nodeBorderColor="#ffffff"
              linkThickness={d => Math.max(1, Math.min(6, Math.sqrt(d.value || 1)))}
              linkColor={{ from: 'source.color', modifiers: [['opacity', 0.6]] }}
              enableClickCapture={true}
              onClick={(node, event) => {
                  logger.info('Clicked node:', node);
              }}
              tooltip={({ node }) => (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{node.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {node.type === 'center' && <span className="text-yellow-600 font-medium">🏅 Olympic Hub</span>}
                    {node.type === 'city' && <span className="text-orange-600 font-medium">🏙️ Host City</span>}
                    {node.type === 'venue' && <span className="text-green-600 font-medium">🏟️ Olympic Venue</span>}
                    {node.type === 'sport' && <span className="text-blue-600 font-medium">⚽ Olympic Sport</span>}
                  </div>
                  {node.type === 'venue' && node.capacity && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Capacity: {node.capacity.toLocaleString()}
                    </div>
                  )}
                  {node.type === 'venue' && node.year && (
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Year: {node.year} ({node.season})
                    </div>
                  )}
                  {node.type === 'city' && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Size reflects number of venues
                    </div>
                  )}
                </div>
              )}
              theme={{
                background: 'transparent',
                text: {
                  fill: '#374151',
                  fontSize: 10
                },
                tooltip: {
                  container: {
                    background: '#ffffff',
                    color: '#333333',
                    fontSize: '12px',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  },
                },
              }}
              animate={true}
              motionConfig="gentle"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No network data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your filters to see connections</p>
            </div>
          )}
        </div>

        {/* Network Instructions */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Hover over nodes for details • Click nodes to focus • Network auto-adjusts for better visualization
          </p>
        </div>

        {/* Network Legend */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Olympics</span>
            </div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">Central hub (Level 1)</div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-pink-400"></div>
              <span className="text-sm font-medium text-pink-800 dark:text-pink-200">Cities</span>
            </div>
            <div className="text-xs text-pink-600 dark:text-pink-400">Host cities (Level 2)</div>
          </div>
          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-violet-500"></div>
              <span className="text-sm font-medium text-violet-800 dark:text-violet-200">Venues</span>
            </div>
            <div className="text-xs text-violet-600 dark:text-violet-400">Olympic venues (Level 3)</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Sports</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Olympic sports (Level 4)</div>
          </div>
        </div>
      </div>

      {/* Sankey Diagram Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            🌊 Olympic Venue Evolution & Usage Patterns
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Flow showing: Construction Era → Venue Type (Indoor/Outdoor) → Sports Categories → Season Type
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 h-96">
          {sankeyData.links.length > 0 ? (
            <ResponsiveSankey
              data={sankeyData}
              margin={{ top: 40, right: 200, bottom: 40, left: 60 }}
              align="justify"
              colors={['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5', '#ffc658', '#ff7c7c', '#d084a0', '#8dd3c7']}
              nodeOpacity={1}
              nodeHoverOthersOpacity={0.5}
              nodeThickness={16}
              nodeSpacing={32}
              nodeBorderWidth={1}
              nodeBorderColor={{
                from: 'color',
                modifiers: [['darker', 0.3]]
              }}
              linkOpacity={0.9}
              linkHoverOthersOpacity={0.3}
              linkContract={0}
              enableLinkGradient={true}
              linkBlendMode="normal"
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={8}
              labelTextColor="#ffffff"
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  translateX: 190,
                  translateY: -10,
                  itemWidth: 120,
                  itemHeight: 12,
                  itemDirection: 'right-to-left',
                  itemsSpacing: 3,
                  itemTextColor: '#ffffff',
                  symbolSize: 10,
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: '#e5e7eb'
                      }
                    }
                  ]
                }
              ]}
              tooltip={({ node }) => (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-w-xs">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{node.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {node.category === 'era' && <span className="text-amber-600 font-medium">�️ Construction Era</span>}
                    {node.category === 'venue_type' && <span className="text-green-600 font-medium">�️ Venue Type</span>}
                    {node.category === 'sport_category' && <span className="text-blue-600 font-medium">� Sports Category</span>}
                    {node.category === 'season' && <span className="text-purple-600 font-medium">❄️☀️ Season Type</span>}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Flow Value: {node.value?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-400">
                    Shows historical venue evolution and sports adaptation patterns
                  </div>
                </div>
              )}
              theme={{
                background: 'transparent',
                text: {
                  fill: '#ffffff',
                  fontSize: 10,
                  fontWeight: 500
                },
                tooltip: {
                  container: {
                    background: '#ffffff',
                    color: '#333333',
                    fontSize: '12px',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  },
                }
              }}
              animate={true}
              motionConfig="gentle"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No flow data available</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your filters to see venue usage flows</p>
            </div>
          )}
        </div>

        {/* Sankey Instructions */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 Hover over nodes and links for details • Flow thickness represents venue capacity • Colors represent different stages
          </p>
        </div>

        {/* Sankey Legend */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-amber-400"></div>
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Construction Era</span>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400">When venues were built</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-green-400"></div>
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Venue Type</span>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">Indoor vs outdoor facilities</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Sports Categories</span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Grouped by sport type</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-purple-400"></div>
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Season Type</span>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Winter vs Summer Olympics</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3">
          <div className="text-sm text-violet-600 dark:text-violet-400">Total Venues Shown</div>
          <div className="text-lg font-semibold text-violet-900 dark:text-violet-100">
            {scatterData.reduce((sum, category) => sum + category.data.length, 0)}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="text-sm text-purple-600 dark:text-purple-400">Sport Categories</div>
          <div className="text-lg font-semibold text-purple-900 dark:text-purple-100">
            {scatterData.length}
          </div>
        </div>
        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-lg p-3">
          <div className="text-sm text-fuchsia-600 dark:text-fuchsia-400">Flow Connections</div>
          <div className="text-lg font-semibold text-fuchsia-900 dark:text-fuchsia-100">
            {sankeyData.links.length}
          </div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
          <div className="text-sm text-indigo-600 dark:text-indigo-400">Year Span</div>
          <div className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
            {yearRange[1] - yearRange[0]} years
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default InteractiveFeatures;
