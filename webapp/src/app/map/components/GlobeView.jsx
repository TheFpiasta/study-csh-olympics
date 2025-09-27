'use client';

import React, { useState, useCallback, useEffect, useRef, useImperativeHandle } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import dynamic from 'next/dynamic';
import logger from '@/components/logger';
import GlobeWrapper from './GlobeWrapper';

const GlobeView = React.forwardRef(({ onDataUpdate, onChartsToggle, onTimelineDataUpdate, showCharts: externalShowCharts, viewMode, toggleViewMode }, ref) => {
  const globeEl = useRef();
  const globeInstance = useRef();
  const [Globe, setGlobe] = useState(null);
  const [globeLoadError, setGlobeLoadError] = useState(null);
  
  // Hydration-safe state - start with defaults, load from storage after mount
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize with default values, will be updated after hydration
  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedOlympics, setSelectedOlympics] = useState('2012_London');
  const [loading, setLoading] = useState(false);
  const [showOlympicsPanel, setShowOlympicsPanel] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedStatusBreakdown, setExpandedStatusBreakdown] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true); // Timeline always visible by default
  const [timelineMode, setTimelineMode] = useState(false);
  const [timelineStartYear, setTimelineStartYear] = useState(1896);
  const [timelineEndYear, setTimelineEndYear] = useState(2018);
  const [filteredGames, setFilteredGames] = useState([]);
  const [showStartLabel, setShowStartLabel] = useState(false);
  const [showEndLabel, setShowEndLabel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [filterMode, setFilterMode] = useState('status'); // 'status' or 'sports'
  const [selectedStatuses, setSelectedStatuses] = useState(new Set()); // Will be populated when geojsonData is available
  const [selectedSports, setSelectedSports] = useState(new Set()); // Will be populated when geojsonData is available
  const [availableSports, setAvailableSports] = useState([]); // Cached sports for current dataset
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic status system - extract from actual data
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [statusColors, setStatusColors] = useState({});

  // Predefined colors for common statuses (fallback to generated colors for new ones)
  const predefinedStatusColors = {
    'in use': '#22c55e',
    'in use (rebuilt)': '#10b981',
    'in use (repurposed)': '#06b6d4',
    'in use (seasonal)': '#3b82f6',
    'in use (limited)': '#8b5cf6',
    'not in use': '#ef4444',
    'not in use (demolished)': '#dc2626',
    'dismantled (temporary)': '#991b1b',
    'dismantled (seasonal)': '#7c2d12',
    'no status data': '#94a3b8',
    'not in use, partly dismantled': '#b91c1c',
    'not in use, currently under reconstruction': '#f97316'
  };

  // Generate color for status (case-insensitive)
  const generateStatusColor = (status) => {
    const lowerStatus = status.toLowerCase();
    if (predefinedStatusColors[lowerStatus]) {
      return predefinedStatusColors[lowerStatus];
    }
    // Generate a color based on status hash for consistency
    let hash = 0;
    for (let i = 0; i < status.length; i++) {
      hash = status.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 50%)`;
  };

  // Extract unique statuses from GeoJSON data
  const extractUniqueStatuses = (geojsonData) => {
    if (!geojsonData || !geojsonData.features) return [];
    
    const statusMap = {}; // Use object to track canonical form
    geojsonData.features.forEach(feature => {
      const status = feature.properties.status || 'No status data';
      const lowerStatus = status.toLowerCase();
      
      // If we haven't seen this status (case-insensitive), add it
      // Use the first occurrence as the canonical form
      if (!statusMap[lowerStatus]) {
        statusMap[lowerStatus] = status;
      }
    });
    
    return Object.values(statusMap).sort();
  };

  // Hydration effect - load saved values after component mounts
  useEffect(() => {
    setIsHydrated(true);
    
    // Load saved values from sessionStorage
    if (typeof window !== 'undefined') {
      // Load selected olympics
      const savedOlympics = sessionStorage.getItem('olympics-selected-game');
      if (savedOlympics) {
        setSelectedOlympics(savedOlympics);
      }
      
      // Load timeline mode
      const savedTimelineMode = sessionStorage.getItem('olympics-timeline-mode');
      if (savedTimelineMode) {
        try {
          setTimelineMode(JSON.parse(savedTimelineMode));
        } catch (e) {
            logger.warn('Failed to parse saved timeline mode:', e);
        }
      }
      
      // Load timeline start year
      const savedStartYear = sessionStorage.getItem('olympics-timeline-start-year');
      if (savedStartYear) {
        try {
          setTimelineStartYear(parseInt(savedStartYear));
        } catch (e) {
            logger.warn('Failed to parse saved timeline start year:', e);
        }
      }
      
      // Load timeline end year
      const savedEndYear = sessionStorage.getItem('olympics-timeline-end-year');
      if (savedEndYear) {
        try {
          setTimelineEndYear(parseInt(savedEndYear));
        } catch (e) {
            logger.warn('Failed to parse saved timeline end year:', e);
        }
      }
      
      // Load selected statuses
      const savedStatuses = sessionStorage.getItem('olympics-selected-statuses');
      if (savedStatuses) {
        try {
          setSelectedStatuses(new Set(JSON.parse(savedStatuses)));
        } catch (e) {
            logger.warn('Failed to parse saved selected statuses:', e);
        }
      }
    }
  }, []);

  // Fullscreen functionality
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        const globeContainer = globeEl.current?.parentElement || globeEl.current;
        if (globeContainer && globeContainer.requestFullscreen) {
          await globeContainer.requestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      logger.warn('Fullscreen operation failed:', error);
    }
  }, []);

  // Handle globe resize when fullscreen state changes
  useEffect(() => {
    const resizeGlobe = () => {
      if (globeInstance.current) {
        try {
          // Force globe to recalculate dimensions
          if (typeof globeInstance.current.width === 'function') {
            const container = globeEl.current?.parentElement || globeEl.current;
            if (container) {
              const rect = container.getBoundingClientRect();
              globeInstance.current
                .width(rect.width)
                .height(rect.height);
            }
          }
        } catch (error) {
          logger.warn('Failed to resize globe:', error);
        }
      }
    };

    if (globeInstance.current) {
      // Give the browser time to complete the fullscreen transition
      const timer = setTimeout(resizeGlobe, 100);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // Handle window resize events (including fullscreen transitions)
  useEffect(() => {
    const handleResize = () => {
      if (globeInstance.current) {
        // Debounce resize events
        const timer = setTimeout(() => {
          try {
            if (typeof globeInstance.current.width === 'function') {
              const container = globeEl.current?.parentElement || globeEl.current;
              if (container) {
                const rect = container.getBoundingClientRect();
                globeInstance.current
                  .width(rect.width)
                  .height(rect.height);
              }
            }
          } catch (error) {
            logger.warn('Failed to resize globe on window resize:', error);
          }
        }, 150);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Available Olympic Games - based on actual files in geojson_scraper/combined_geojson
  const availableOlympics = [
    { id: '1896_Athens', name: '1896 Athens Olympics', year: '1896', city: 'Athens', season: 'Summer', center: [23.7275, 37.9838], zoom: 11 },
    { id: '1900_Paris', name: '1900 Paris Olympics', year: '1900', city: 'Paris', season: 'Summer', center: [2.3522, 48.8566], zoom: 11 },
    { id: '1904_St._Louis', name: '1904 St. Louis Olympics', year: '1904', city: 'St. Louis', season: 'Summer', center: [-90.1994, 38.6270], zoom: 11 },
    { id: '1908_London', name: '1908 London Olympics', year: '1908', city: 'London', season: 'Summer', center: [-0.1276, 51.5074], zoom: 11 },
    { id: '1912_Stockholm', name: '1912 Stockholm Olympics', year: '1912', city: 'Stockholm', season: 'Summer', center: [18.0686, 59.3293], zoom: 11 },
    { id: '1920_Antwerp', name: '1920 Antwerp Olympics', year: '1920', city: 'Antwerp', season: 'Summer', center: [4.4025, 51.2194], zoom: 11 },
    { id: '1924_Chamonix', name: '1924 Chamonix Olympics', year: '1924', city: 'Chamonix', season: 'Winter', center: [6.8694, 45.9237], zoom: 11 },
    { id: '1924_Paris', name: '1924 Paris Olympics', year: '1924', city: 'Paris', season: 'Summer', center: [2.3522, 48.8566], zoom: 11 },
    { id: '1928_Amsterdam', name: '1928 Amsterdam Olympics', year: '1928', city: 'Amsterdam', season: 'Summer', center: [4.9041, 52.3676], zoom: 11 },
    { id: '1928_St._Moritz', name: '1928 St. Moritz Olympics', year: '1928', city: 'St. Moritz', season: 'Winter', center: [9.8355, 46.4908], zoom: 11 },
    { id: '1932_Lake_Placid', name: '1932 Lake Placid Olympics', year: '1932', city: 'Lake Placid', season: 'Winter', center: [-73.9826, 44.2795], zoom: 11 },
    { id: '1932_Los_Angeles', name: '1932 Los Angeles Olympics', year: '1932', city: 'Los Angeles', season: 'Summer', center: [-118.2437, 34.0522], zoom: 11 },
    { id: '1936_Berlin', name: '1936 Berlin Olympics', year: '1936', city: 'Berlin', season: 'Summer', center: [13.4050, 52.5200], zoom: 11 },
    { id: '1936_Garmisch_Partenkirchen', name: '1936 Garmisch-Partenkirchen Olympics', year: '1936', city: 'Garmisch-Partenkirchen', season: 'Winter', center: [11.0958, 47.4916], zoom: 11 },
    { id: '1948_London', name: '1948 London Olympics', year: '1948', city: 'London', season: 'Summer', center: [-0.1276, 51.5074], zoom: 11 },
    { id: '1948_St._Moritz', name: '1948 St. Moritz Olympics', year: '1948', city: 'St. Moritz', season: 'Winter', center: [9.8355, 46.4908], zoom: 11 },
    { id: '1952_Helsinki', name: '1952 Helsinki Olympics', year: '1952', city: 'Helsinki', season: 'Summer', center: [24.9384, 60.1699], zoom: 11 },
    { id: '1952_Oslo', name: '1952 Oslo Olympics', year: '1952', city: 'Oslo', season: 'Winter', center: [10.7522, 59.9139], zoom: 11 },
    { id: '1956_Cortina_d_Ampezzo', name: '1956 Cortina d\'Ampezzo Olympics', year: '1956', city: 'Cortina d\'Ampezzo', season: 'Winter', center: [12.1357, 46.5369], zoom: 11 },
    { id: '1956_Melbourne', name: '1956 Melbourne Olympics', year: '1956', city: 'Melbourne', season: 'Summer', center: [144.9631, -37.8136], zoom: 11 },
    { id: '1960_Rome', name: '1960 Rome Olympics', year: '1960', city: 'Rome', season: 'Summer', center: [12.4964, 41.9028], zoom: 11 },
    { id: '1960_Squaw_Valley', name: '1960 Squaw Valley Olympics', year: '1960', city: 'Squaw Valley', season: 'Winter', center: [-120.2355, 39.1970], zoom: 11 },
    { id: '1964_Innsbruck', name: '1964 Innsbruck Olympics', year: '1964', city: 'Innsbruck', season: 'Winter', center: [11.4041, 47.2692], zoom: 11 },
    { id: '1964_Tokyo', name: '1964 Tokyo Olympics', year: '1964', city: 'Tokyo', season: 'Summer', center: [139.6503, 35.6762], zoom: 11 },
    { id: '1968_Grenoble', name: '1968 Grenoble Olympics', year: '1968', city: 'Grenoble', season: 'Winter', center: [5.7243, 45.1885], zoom: 11 },
    { id: '1968_Mexico_City', name: '1968 Mexico City Olympics', year: '1968', city: 'Mexico City', season: 'Summer', center: [-99.1332, 19.4326], zoom: 11 },
    { id: '1972_Munich', name: '1972 Munich Olympics', year: '1972', city: 'Munich', season: 'Summer', center: [11.5820, 48.1351], zoom: 11 },
    { id: '1972_Sapporo', name: '1972 Sapporo Olympics', year: '1972', city: 'Sapporo', season: 'Winter', center: [141.3545, 43.0642], zoom: 11 },
    { id: '1976_Innsbruck', name: '1976 Innsbruck Olympics', year: '1976', city: 'Innsbruck', season: 'Winter', center: [11.4041, 47.2692], zoom: 11 },
    { id: '1976_Montreal', name: '1976 Montreal Olympics', year: '1976', city: 'Montreal', season: 'Summer', center: [-73.5673, 45.5017], zoom: 11 },
    { id: '1980_Lake_Placid', name: '1980 Lake Placid Olympics', year: '1980', city: 'Lake Placid', season: 'Winter', center: [-73.9826, 44.2795], zoom: 11 },
    { id: '1980_Moscow', name: '1980 Moscow Olympics', year: '1980', city: 'Moscow', season: 'Summer', center: [37.6173, 55.7558], zoom: 11 },
    { id: '1984_Los_Angeles', name: '1984 Los Angeles Olympics', year: '1984', city: 'Los Angeles', season: 'Summer', center: [-118.2437, 34.0522], zoom: 11 },
    { id: '1984_Sarajevo', name: '1984 Sarajevo Olympics', year: '1984', city: 'Sarajevo', season: 'Winter', center: [18.4131, 43.8486], zoom: 11 },
    { id: '1988_Calgary', name: '1988 Calgary Olympics', year: '1988', city: 'Calgary', season: 'Winter', center: [-114.0719, 51.0447], zoom: 11 },
    { id: '1988_Seoul', name: '1988 Seoul Olympics', year: '1988', city: 'Seoul', season: 'Summer', center: [126.9780, 37.5665], zoom: 11 },
    { id: '1992_Albertville', name: '1992 Albertville Olympics', year: '1992', city: 'Albertville', season: 'Winter', center: [6.3917, 45.6758], zoom: 11 },
    { id: '1992_Barcelona', name: '1992 Barcelona Olympics', year: '1992', city: 'Barcelona', season: 'Summer', center: [2.1734, 41.3851], zoom: 11 },
    { id: '1994_Lillehammer', name: '1994 Lillehammer Olympics', year: '1994', city: 'Lillehammer', season: 'Winter', center: [10.4662, 61.1153], zoom: 11 },
    { id: '1996_Atlanta', name: '1996 Atlanta Olympics', year: '1996', city: 'Atlanta', season: 'Summer', center: [-84.3880, 33.7490], zoom: 11 },
    { id: '1998_Nagano', name: '1998 Nagano Olympics', year: '1998', city: 'Nagano', season: 'Winter', center: [138.1811, 36.6513], zoom: 11 },
    { id: '2000_Sydney', name: '2000 Sydney Olympics', year: '2000', city: 'Sydney', season: 'Summer', center: [151.2093, -33.8688], zoom: 11 },
    { id: '2002_Salt_Lake_City', name: '2002 Salt Lake City Olympics', year: '2002', city: 'Salt Lake City', season: 'Winter', center: [-111.8910, 40.7608], zoom: 11 },
    { id: '2004_Athens', name: '2004 Athens Olympics', year: '2004', city: 'Athens', season: 'Summer', center: [23.7275, 37.9838], zoom: 11 },
    { id: '2006_Turin', name: '2006 Turin Olympics', year: '2006', city: 'Turin', season: 'Winter', center: [7.6869, 45.0703], zoom: 11 },
    { id: '2008_Beijing', name: '2008 Beijing Olympics', year: '2008', city: 'Beijing', season: 'Summer', center: [116.4074, 39.9042], zoom: 11 },
    { id: '2010_Vancouver', name: '2010 Vancouver Olympics', year: '2010', city: 'Vancouver', season: 'Winter', center: [-123.1207, 49.2827], zoom: 11 },
    { id: '2012_London', name: '2012 London Olympics', year: '2012', city: 'London', season: 'Summer', center: [-0.1276, 51.5074], zoom: 11 },
    { id: '2014_Sochi', name: '2014 Sochi Olympics', year: '2014', city: 'Sochi', season: 'Winter', center: [39.7257, 43.6028], zoom: 11 },
    { id: '2016_Rio', name: '2016 Rio Olympics', year: '2016', city: 'Rio de Janeiro', season: 'Summer', center: [-43.1729, -22.9068], zoom: 11 },
    { id: '2018_Pyeongchang', name: '2018 Pyeongchang Olympics', year: '2018', city: 'Pyeongchang', season: 'Winter', center: [128.6956, 37.3706], zoom: 11 }
  ];

  useEffect(() => {
    // Only load data after hydration is complete to ensure we have the correct session values
    if (isHydrated && !timelineMode) {
      // In single game mode, load the selected olympics
      loadOlympicsData(selectedOlympics);
    }
  }, [selectedOlympics, timelineMode, isHydrated]);

  // Extract and set up status values when geojsonData changes
  useEffect(() => {
    if (geojsonData && geojsonData.features) {
      const uniqueStatuses = extractUniqueStatuses(geojsonData);
      setAvailableStatuses(uniqueStatuses);
      
      // Generate colors for all statuses
      const colors = {};
      uniqueStatuses.forEach(status => {
        colors[status] = generateStatusColor(status);
      });
      setStatusColors(colors);
      
      // Reconcile selectedStatuses with new canonical forms
      if (selectedStatuses.size === 0) {
        // Initialize with all statuses if empty
        setSelectedStatuses(new Set(uniqueStatuses));
      } else {
        // Update existing selections to match canonical forms
        const newSelected = new Set();
        selectedStatuses.forEach(selectedStatus => {
          // Find matching canonical form (case-insensitive)
          const canonicalForm = uniqueStatuses.find(status => 
            status.toLowerCase() === selectedStatus.toLowerCase()
          );
          if (canonicalForm) {
            newSelected.add(canonicalForm);
          }
        });
        setSelectedStatuses(newSelected);
      }
    }
  }, [geojsonData]);

  // Create filtered GeoJSON data based on BOTH selected statuses AND sports (simultaneous filtering)
  const filteredGeojsonData = React.useMemo(() => {
    if (!geojsonData || !geojsonData.features) return geojsonData;
    
    return {
      ...geojsonData,
      features: geojsonData.features.filter(feature => {
        // Apply status filter (case-insensitive)
        const status = feature.properties.status || 'No status data';
        const statusMatch = Array.from(selectedStatuses).some(selectedStatus => 
          selectedStatus.toLowerCase() === status.toLowerCase()
        );
        
        // Apply sports filter
        const sports = feature.properties.sports;
        let sportsMatch = true; // Default to true if all sports are selected
        
        if (selectedSports.size < availableSports.length) {
          // Apply sports filter when not all sports are selected (including when none are selected)
          if (!sports) {
            sportsMatch = false;
          } else {
            let sportsArray = [];
            if (Array.isArray(sports)) {
              sportsArray = sports;
            } else if (typeof sports === 'string') {
              try {
                const parsed = JSON.parse(sports);
                sportsArray = Array.isArray(parsed) ? parsed : [sports];
              } catch {
                sportsArray = [sports];
              }
            }
            
            // Check if any of the venue's sports are selected
            sportsMatch = sportsArray.some(sport => selectedSports.has(sport.trim()));
          }
        }
        
        // Both filters must pass (AND logic)
        return statusMatch && sportsMatch;
      })
    };
  }, [geojsonData, selectedStatuses, selectedSports, availableSports]);

  // Helper functions to detect active filters (when not all items are selected)
  const isStatusFilterActive = selectedStatuses.size < availableStatuses.length;
  const isSportsFilterActive = selectedSports.size < availableSports.length;
  const isAnyFilterActive = isStatusFilterActive || isSportsFilterActive;

  // Notify parent component when data changes
  useEffect(() => {
    if (onDataUpdate) {
      onDataUpdate(filteredGeojsonData);
    }
  }, [filteredGeojsonData, onDataUpdate]);

  // Notify parent when charts toggle changes
  useEffect(() => {
    if (onChartsToggle) {
      onChartsToggle(showCharts);
    }
  }, [showCharts, onChartsToggle]);

  // Sync external showCharts state
  useEffect(() => {
    if (externalShowCharts !== undefined && externalShowCharts !== showCharts) {
      setShowCharts(externalShowCharts);
    }
  }, [externalShowCharts]);

  // Notify parent when timeline data changes
  useEffect(() => {
    if (onTimelineDataUpdate) {
      onTimelineDataUpdate({
        timelineMode,
        filteredGames,
        geojsonData,
        timelineStartYear,
        timelineEndYear
      });
    }
  }, [timelineMode, filteredGames, geojsonData, timelineStartYear, timelineEndYear, onTimelineDataUpdate]);

  // Filter games based on timeline selection (only after hydration)
  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration
    
    if (timelineMode) {
      const filtered = availableOlympics.filter(olympics => {
        const year = parseInt(olympics.year);
        return year >= timelineStartYear && year <= timelineEndYear;
      });
      setFilteredGames(filtered);
    } else {
      setFilteredGames([]);
    }
  }, [timelineStartYear, timelineEndYear, timelineMode, isHydrated]);

  // Load initial data after hydration is complete
  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration to complete
    
    if (!timelineMode) {
      // In single game mode, load the selected olympics
      setTimeout(() => loadOlympicsData(selectedOlympics), 100);
    }
    // Timeline mode data loading is handled by the filteredGames effect
  }, [isHydrated, timelineMode, selectedOlympics]); // React to mode and game changes after hydration

  // Load timeline data when filteredGames changes (after hydration)
  useEffect(() => {
    if (isHydrated && timelineMode && filteredGames.length > 0) {
      // Auto-load all games in timeline mode when filteredGames is set
      const timer = setTimeout(() => {
        loadFilteredGamesData();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [filteredGames, isHydrated, timelineMode]);

  // Save selected Olympics to sessionStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('olympics-selected-game', selectedOlympics);
    }
  }, [selectedOlympics, isHydrated]);

  // Save timeline mode to sessionStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('olympics-timeline-mode', JSON.stringify(timelineMode));
    }
  }, [timelineMode, isHydrated]);

  // Save timeline start year to sessionStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('olympics-timeline-start-year', timelineStartYear.toString());
    }
  }, [timelineStartYear, isHydrated]);

  // Save timeline end year to sessionStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('olympics-timeline-end-year', timelineEndYear.toString());
    }
  }, [timelineEndYear, isHydrated]);

  // Save selected statuses to sessionStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('olympics-selected-statuses', JSON.stringify(Array.from(selectedStatuses)));
    }
  }, [selectedStatuses, isHydrated]);

  // Click outside to close panels
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Get all elements that should NOT close the panels when clicked
      const olympicsButton = event.target.closest('[data-panel="olympics-button"]');
      const olympicsPanel = event.target.closest('[data-panel="olympics-panel"]');
      
      // Close olympics panel if click is outside both button and panel
      if (showOlympicsPanel && !olympicsButton && !olympicsPanel) {
        setShowOlympicsPanel(false);
      }
      
      // Close status panel if click is outside both button and panel
      const statusButton = event.target.closest('[data-panel="status-button"]');
      const statusPanel = event.target.closest('[data-panel="status-panel"]');
      if (showStatusPanel && !statusButton && !statusPanel) {
        setShowStatusPanel(false);
      }
    };

    // Add event listener to document
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOlympicsPanel, showStatusPanel]);

  const loadOlympicsData = async (olympicsId) => {
    setLoading(true);
    setSelectedVenue(null); // Clear any open popup
    try {
      // Load from the API endpoint that serves the real geojson files
      const response = await fetch(`/api/olympics/${olympicsId}`);
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      const data = await response.json();
      
      // First update the data
      setGeojsonData(data);
      
      // For globe view, focus the globe on the Olympic location
      const olympics = availableOlympics.find(o => o.id === olympicsId);
      if (olympics && globeInstance.current) {
        // Smoothly rotate to the new location
        globeInstance.current.pointOfView({ 
          lat: olympics.center[1], 
          lng: olympics.center[0],
          altitude: 2
        }, 2500);
      }
      
      setTimeout(() => setLoading(false), 1000);
    } catch (error) {
        logger.error('Error loading Olympics data:', error);
      setLoading(false);
    }
  };

  // Function to extract all unique sports from geojson data - optimized to return sorted array
  const extractUniqueSports = (geojsonData) => {
    if (!geojsonData || !geojsonData.features) return [];
    
    const sportsSet = new Set();
    
    geojsonData.features.forEach(feature => {
      const sports = feature.properties.sports;
      if (sports) {
        let sportsArray = [];
        
        if (Array.isArray(sports)) {
          sportsArray = sports;
        } else if (typeof sports === 'string') {
          try {
            const parsed = JSON.parse(sports);
            sportsArray = Array.isArray(parsed) ? parsed : [sports];
          } catch {
            sportsArray = [sports];
          }
        }
        
        sportsArray.forEach(sport => {
          if (sport && sport.trim()) {
            sportsSet.add(sport.trim());
          }
        });
      }
    });
    
    return Array.from(sportsSet).sort(); // Return sorted array for consistent UI
  };

  // Cache sports data and initialize selectedSports when geojsonData changes
  useEffect(() => {
    if (geojsonData) {
        logger.debug('Extracting sports for new dataset...'); // Debug log
      const sports = extractUniqueSports(geojsonData);
      setAvailableSports(sports); // Cache the sports array
      setSelectedSports(new Set(sports)); // Select all sports by default
        logger.debug(`Cached ${sports.length} unique sports`); // Debug log
    } else {
      // Clear cache when no data
      setAvailableSports([]);
      setSelectedSports(new Set());
    }
  }, [geojsonData]); // Only run when geojsonData changes (Olympics change or multi-game mode)

  const handleOlympicsChange = (olympicsId) => {
    setSelectedOlympics(olympicsId);
  };

  const loadFilteredGamesData = async () => {
    if (filteredGames.length === 0) return;
    
    setLoading(true);
    setSelectedVenue(null);
    
    try {
      // Load data for all filtered games and combine them
      const promises = filteredGames.map(async (game) => {
        try {
          const response = await fetch(`/api/olympics/${game.id}`);
          if (!response.ok) {
              logger.warn(`Failed to load data for ${game.name}: ${response.status}`);
            return null; // Return null for failed requests
          }
          return await response.json();
        } catch (error) {
            logger.warn(`Error loading data for ${game.name}:`, error);
          return null; // Return null for failed requests
        }
      });
      
      const allData = await Promise.all(promises);
      
      // Filter out null results and combine all features into one GeoJSON
      const validData = allData.filter(data => data !== null);
      
      const combinedFeatures = validData.reduce((acc, data, dataIndex) => {
        if (data && data.features) {
          // Find the corresponding game info for this valid data set
          const validGameIndex = allData.findIndex((d, i) => d === data);
          const gamesInfo = filteredGames[validGameIndex];
          
          const enhancedFeatures = data.features.map(feature => ({
            ...feature,
            properties: {
              ...feature.properties,
              olympics_game: gamesInfo?.name || 'Unknown',
              olympics_year: gamesInfo?.year || 'Unknown',
              olympics_city: gamesInfo?.city || 'Unknown',
              olympics_season: gamesInfo?.season || 'Unknown'
            }
          }));
          
          return [...acc, ...enhancedFeatures];
        }
        return acc;
      }, []);
      
      const combinedGeojson = {
        type: "FeatureCollection",
        features: combinedFeatures
      };
      
      setGeojsonData(combinedGeojson);
      
      // For globe view in timeline mode, zoom out to show the world
      if (globeInstance.current) {
        globeInstance.current.pointOfView({ 
          lat: 20, 
          lng: 0,
          altitude: 2.5
        }, 2500);
      }
      
      setTimeout(() => setLoading(false), 1500);
    } catch (error) {
        logger.error('Error loading filtered Olympics data:', error);
      setLoading(false);
    }
  };

  const clearTimelineMode = () => {
    setTimelineMode(false);
    setFilteredGames([]);
    // Reload the originally selected single game
    loadOlympicsData(selectedOlympics);
  };

  const enableTimelineMode = () => {
    setTimelineMode(true);
    // Load filtered games data automatically
    const filtered = availableOlympics.filter(olympics => {
      const year = parseInt(olympics.year);
      return year >= timelineStartYear && year <= timelineEndYear;
    });
    setFilteredGames(filtered);
    if (filtered.length > 0) {
      loadFilteredGamesData();
    }
  };

  // Timeline drag handling with touch support
  const handleTimelineMouseDown = (e, markerType) => {
    if (!timelineMode) return; // Only allow dragging in timeline mode
    
    e.preventDefault();
    const timelineContainer = e.currentTarget.parentElement;
    const containerRect = timelineContainer.getBoundingClientRect();
    
    // Show label for the marker being dragged
    setIsDragging(true);
    if (markerType === 'start') {
      setShowStartLabel(true);
    } else {
      setShowEndLabel(true);
    }
    
    const getEventCoordinates = (event) => {
      // Handle both mouse and touch events
      if (event.touches && event.touches.length > 0) {
        return { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
      return { x: event.clientX, y: event.clientY };
    };
    
    const updateMarkerPosition = (eventCoords) => {
      const x = eventCoords.x - containerRect.left;
      const percentage = Math.max(0, Math.min(1, x / containerRect.width));
      const year = Math.round(1896 + percentage * (2018 - 1896));
      
      // Snap to even years (Olympics happen every 2/4 years)
      const snappedYear = Math.round(year / 2) * 2;
      
      if (markerType === 'start') {
        setTimelineStartYear(Math.min(snappedYear, timelineEndYear));
      } else {
        setTimelineEndYear(Math.max(snappedYear, timelineStartYear));
      }
    };
    
    const handleMove = (moveEvent) => {
      moveEvent.preventDefault();
      updateMarkerPosition(getEventCoordinates(moveEvent));
    };
    
    const handleEnd = () => {
      // Remove all event listeners
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove, { passive: false });
      document.removeEventListener('touchend', handleEnd);
      
      // Hide labels after dragging with a delay
      setIsDragging(false);
      setTimeout(() => {
        if (markerType === 'start') {
          setShowStartLabel(false);
        } else {
          setShowEndLabel(false);
        }
      }, 1000); // Hide after 1 second
      
      // Auto-update the map when dragging ends
      setTimeout(() => {
        const filtered = availableOlympics.filter(olympics => {
          const year = parseInt(olympics.year);
          return year >= timelineStartYear && year <= timelineEndYear;
        });
        if (filtered.length > 0) {
          loadFilteredGamesData();
        }
      }, 100);
    };
    
    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  // Handle touch start events for timeline markers
  const handleTimelineTouchStart = (e, markerType) => {
    // Prevent default touch behavior to avoid scrolling
    e.preventDefault();
    handleTimelineMouseDown(e, markerType);
  };

  // Handle timeline track clicks and touches
  const handleTimelineTrackInteraction = (e) => {
    if (!timelineMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX;
    
    // Handle both mouse and touch events
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const x = clientX - rect.left;
    const percentage = x / rect.width;
    const year = Math.round(1896 + percentage * (2018 - 1896));
    const snappedYear = Math.round(year / 2) * 2;
    
    // Move the closest marker
    const distanceToStart = Math.abs(snappedYear - timelineStartYear);
    const distanceToEnd = Math.abs(snappedYear - timelineEndYear);
    
    if (distanceToStart <= distanceToEnd) {
      setTimelineStartYear(Math.min(snappedYear, timelineEndYear));
    } else {
      setTimelineEndYear(Math.max(snappedYear, timelineStartYear));
    }
    
    // Auto-update the map when clicking timeline
    setTimeout(() => {
      const filtered = availableOlympics.filter(olympics => {
        const year = parseInt(olympics.year);
        return year >= timelineStartYear && year <= timelineEndYear;
      });
      if (filtered.length > 0) {
        loadFilteredGamesData();
      }
    }, 100);
  };

  // Status color mapping
  const getStatusColor = (status) => {
    if (!status) return '#94a3b8'; // neutral gray for no status
    
    if (status.includes('In use')) {
      if (status.includes('rebuilt')) return '#10b981'; // emerald for rebuilt
      if (status.includes('repurposed')) return '#06b6d4'; // cyan for repurposed
      if (status.includes('seasonal')) return '#3b82f6'; // blue for seasonal
      if (status.includes('limited')) return '#8b5cf6'; // violet for limited
      return '#22c55e'; // green for in use
    }
    
    if (status.includes('Not in use')) {
      if (status.includes('demolished')) return '#dc2626'; // red for demolished
      if (status.includes('reconstruction')) return '#f59e0b'; // amber for under reconstruction
      if (status.includes('partly dismantled')) return '#ea580c'; // orange for partly dismantled
      return '#ef4444'; // red for not in use
    }
    
    if (status.includes('Dismantled')) {
      if (status.includes('temporary')) return '#991b1b'; // dark red for dismantled temporary
      if (status.includes('seasonal')) return '#7c2d12'; // dark orange for dismantled seasonal
      return '#7f1d1d'; // very dark red for dismantled
    }
    
    return '#94a3b8'; // default neutral gray
  };

  // Calculate status breakdown for current venues
  const getStatusBreakdown = () => {
    if (!geojsonData || !geojsonData.features) return [];
    
    const statusCounts = {};
    
    geojsonData.features.forEach(feature => {
      const status = feature.properties.status || 'No status data';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Sort by count (descending) and map to include colors
    return Object.entries(statusCounts)
      .map(([status, count]) => {
        return {
          status,
          count,
          color: statusColors[status] || '#94a3b8'
        };
      })
      .sort((a, b) => b.count - a.count);
  };

  // Calculate dynamic width based on number of status entries
  const getDynamicWidth = () => {
    const statusCount = getStatusBreakdown().length;
    if (statusCount === 0) return 'w-80';
    
    // Calculate based on content length and number of columns needed
    const statusBreakdown = getStatusBreakdown();
    const maxTextLength = Math.max(...statusBreakdown.map(item => item.status.length));
    const maxCountLength = Math.max(...statusBreakdown.map(item => item.count.toString().length));
    
    // Base width per item: text + count + padding + dot + gaps
    // Rough calculation: each character ≈ 0.5rem, plus padding and elements
    const baseItemWidth = Math.max(
      8, // minimum width in rem
      (maxTextLength * 0.5) + (maxCountLength * 0.5) + 4 // text + count + padding/elements
    );
    
    // Determine columns (responsive)
    const numColumns = Math.min(4, Math.max(1, Math.floor(statusCount / 3)));
    
    // Calculate total width: (columns * item width) + container padding
    const totalWidth = (numColumns * baseItemWidth) + 8; // 8rem for container padding and gaps
    
    // Clamp between reasonable bounds
    const clampedWidth = Math.max(20, Math.min(80, totalWidth));
    
    return `w-[${clampedWidth}rem]`;
  };

  // Handle Globe.gl loading through wrapper
  const handleGlobeReady = useCallback((GlobeConstructor) => {
    setGlobe(() => GlobeConstructor);
    setGlobeLoadError(null);
  }, []);

  const handleGlobeError = useCallback((error) => {
    logger.error('Failed to load Globe.gl:', error);
    setGlobeLoadError(error.message || 'Failed to load 3D Globe library');
    setGlobe(null);
  }, []);

  // Expose resize method to parent component
  useImperativeHandle(ref, () => ({
    resize: () => {
      if (globeInstance.current) {
        // Trigger a resize of the globe
        setTimeout(() => {
          if (globeEl.current && globeInstance.current) {
            globeInstance.current
              .width(globeEl.current.clientWidth)
              .height(globeEl.current.clientHeight);
          }
        }, 100);
      }
    }
  }), []);

  // Initialize Globe.gl
  useEffect(() => {
    if (!globeEl.current || !Globe) return;

    // Initialize Globe.gl
    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundColor('rgba(0,0,0,0)')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(globeEl.current.clientWidth)
      .height(globeEl.current.clientHeight);

    globeInstance.current = globe;
    globe(globeEl.current);

    return () => {
      if (globeInstance.current) {
        globeInstance.current._destructor?.();
      }
    };
  }, [Globe]);

  // Update globe venues when filtered data changes
  useEffect(() => {
    if (globeInstance.current && filteredGeojsonData && filteredGeojsonData.features) {
      // Convert venues to globe.gl format for filled circles (using htmlElementsData)
      const htmlData = filteredGeojsonData.features.map((venue, index) => ({
        lat: venue.geometry.coordinates[1],
        lng: venue.geometry.coordinates[0],
        color: getStatusColor(venue.properties?.status),
        venue: venue
      }));

      globeInstance.current
        .htmlElementsData(htmlData)
        .htmlElement(d => {
          const el = document.createElement('div');
          el.style.color = d.color;
          el.style.width = '10px';
          el.style.height = '10px';
          el.style.backgroundColor = d.color;
          el.style.borderRadius = '50%';
          el.style.border = '1px solid rgba(255,255,255,0.8)';
          el.style.pointerEvents = 'auto';
          el.style.cursor = 'pointer';
          
          // Add click handler to show venue popup
          el.addEventListener('click', (event) => {
            event.stopPropagation();
            setSelectedVenue({
              longitude: d.venue.geometry.coordinates[0],
              latitude: d.venue.geometry.coordinates[1],
              properties: d.venue.properties
            });
            setExpandedDescription(false);
            
            // Position popup near click location
            const rect = globeEl.current.getBoundingClientRect();
            setPopupPosition({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
            setPopupVisible(true);
          });
          
          return el;
        });
    }
  }, [filteredGeojsonData, Globe]);

  return (
    <div className={`relative w-full h-full max-h-full overflow-hidden shadow-inner ${isFullscreen ? 'rounded-none' : 'rounded-xl'}`}>
      <div className="relative w-full h-full max-h-full overflow-hidden">
        {/* Globe Container */}
        <div 
          ref={globeEl} 
          className="w-full h-full"
          style={{ 
            background: 'transparent',
            minHeight: isFullscreen ? '100vh' : 'auto',
            minWidth: isFullscreen ? '100vw' : 'auto'
          }}
        >
          <GlobeWrapper 
            onGlobeReady={handleGlobeReady}
            onError={handleGlobeError}
          />
        </div>

        {/* Control Buttons - Left Side */}
        <div className="absolute z-[9999] space-y-2 top-4 left-4">
          {/* Olympics Selection Button */}
          <button
            data-panel="olympics-button"
            onClick={() => setShowOlympicsPanel(!showOlympicsPanel)}
            className="block p-3 transition-all duration-300 shadow-lg glass rounded-xl hover:scale-105"
            title="Select Olympic Games"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
              <circle cx="12" cy="8" r="6"></circle>
              <circle cx="8" cy="14" r="3"></circle>
              <circle cx="16" cy="14" r="3"></circle>
            </svg>
          </button>

          {/* Filter Control Button */}
          <button
            data-panel="status-button"
            onClick={() => setShowStatusPanel(!showStatusPanel)}
            className="relative block p-3 transition-all duration-300 shadow-lg glass rounded-xl hover:scale-105"
            title="Filter venues by status and sports"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
            </svg>
            
            {/* Active filter indicator */}
            {isAnyFilterActive && (
              <div className="absolute w-3 h-3 bg-green-500 rounded-full -top-1 -right-1 animate-pulse"></div>
            )}
          </button>

          {/* Charts Control Button */}
          <button
            data-panel="charts-button"
            onClick={() => {
              setShowCharts(!showCharts);
              if (onChartsToggle) onChartsToggle(!showCharts);
            }}
            className={`block p-3 transition-all duration-300 shadow-lg glass rounded-xl hover:scale-105 ${
              showCharts ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            }`}
            title="Toggle charts panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <path d="m7 11 4-4 4 4-2 3h-4l-2-3z"></path>
            </svg>
          </button>

          {/* Globe View Control Button */}
          {toggleViewMode && (
            <button
              data-panel="globe-button"
              onClick={toggleViewMode}
              className="block p-3 transition-all duration-300 shadow-lg glass rounded-xl hover:scale-105"
              title={viewMode === 'globe' ? 'Switch to Map View' : 'Switch to Globe View'}
            >
              {viewMode === 'globe' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              )}
            </button>
          )}

          {/* Fullscreen Control Button */}
          <button
            onClick={toggleFullscreen}
            className="block p-3 transition-all duration-300 shadow-lg glass rounded-xl hover:scale-105"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            )}
          </button>
        </div>

        {/* Olympics Selection Panel */}
        {showOlympicsPanel && (
          <div 
            data-panel="olympics-panel"
            className="absolute top-4 z-[9999] p-4 overflow-y-auto border border-gray-200 shadow-2xl left-20 glass rounded-xl dark:border-gray-600 min-w-72 max-h-96"
            style={{ maxWidth: 'calc(100vw - 100px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Olympic Games</h3>
              <button
                onClick={() => setShowOlympicsPanel(false)}
                className="p-1 text-gray-400 transition-all rounded dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            
            {timelineMode && filteredGames.length > 0 && (
              <div className="p-2 mb-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  📅 Timeline mode active - showing {filteredGames.length} games from {timelineStartYear}-{timelineEndYear}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select a single game to switch to single game mode
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Group by decade for better organization */}
              {(() => {
                const decades = {};
                availableOlympics.forEach(olympics => {
                  const decade = Math.floor(parseInt(olympics.year) / 10) * 10;
                  if (!decades[decade]) decades[decade] = [];
                  decades[decade].push(olympics);
                });
                
                // Sort games within each decade chronologically (newest first)
                Object.keys(decades).forEach(decade => {
                  decades[decade].sort((a, b) => b.year - a.year);
                });
                
                return Object.keys(decades).sort((a, b) => b - a).map(decade => (
                  <div key={decade}>
                    <h4 className="px-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {decade}s
                    </h4>
                    <div className="space-y-1">
                      {decades[decade].map(olympics => (
                        <label key={olympics.id} className="flex items-start p-2 transition-colors rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                          <input
                            type="radio"
                            name="olympics"
                            value={olympics.id}
                            checked={!timelineMode && selectedOlympics === olympics.id}
                            onChange={(e) => {
                              // Switch to single game mode when selecting a game
                              setTimelineMode(false);
                              setFilteredGames([]);
                              handleOlympicsChange(e.target.value);
                              setShowOlympicsPanel(false);
                            }}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                              {olympics.name}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {olympics.year} • {olympics.city}
                              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                                olympics.season === 'Summer' 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {olympics.season}
                              </span>
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            {geojsonData && !loading && (
              <div className="pt-3 mt-3 text-xs text-gray-600 border-t border-gray-200 dark:border-gray-600 dark:text-gray-400">
                <p>{geojsonData.features.length} Olympic venues loaded</p>
              </div>
            )}
            
            {loading && (
              <div className="pt-3 mt-3 text-xs text-blue-600 border-t border-gray-200 dark:border-gray-600 dark:text-blue-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p>Loading Olympic venues...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {loading && geojsonData && (
          <div className="absolute inset-0 z-[9998] flex items-center justify-center backdrop-blur-sm bg-black/20">
            <div className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-200 shadow-xl rounded-xl dark:bg-gray-800 dark:border-gray-600">
              <svg className="w-5 h-5 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Loading Olympic venues...</p>
            </div>
          </div>
        )}

        {/* Filter Panel */}
        {showStatusPanel && (
          <div 
            data-panel="status-panel"
            className="absolute top-4 z-[9999] p-4 border border-gray-200 shadow-2xl left-20 glass rounded-xl dark:border-gray-600 w-96 max-h-96"
            style={{ maxWidth: 'calc(100vw - 100px)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Filter Venues
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Switch between Status and Sports */}
                <div className="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-700">
                  <button
                    onClick={() => setFilterMode('status')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ease-in-out transform ${
                      filterMode === 'status'
                        ? 'bg-emerald-500 text-white shadow-sm scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Status
                  </button>
                  <button
                    onClick={() => setFilterMode('sports')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ease-in-out transform ${
                      filterMode === 'sports'
                        ? 'bg-emerald-500 text-white shadow-sm scale-105'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Sports
                  </button>
                </div>
                
                <button
                  onClick={() => setShowStatusPanel(false)}
                  className="p-1 text-gray-400 transition-all rounded dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {filterMode === 'status' ? (
              <>
                <div className="mb-3 space-x-2">
                  <button
                    onClick={() => setSelectedStatuses(new Set(Object.keys(statusColors)))}
                    className="px-2 py-1 text-xs transition-colors rounded-lg text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedStatuses(new Set())}
                    className="px-2 py-1 text-xs text-gray-700 transition-colors bg-gray-100 rounded-lg dark:bg-gray-900/30 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900/50"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="pr-1 space-y-1 overflow-y-auto max-h-48">
                  {Object.entries(statusColors).map(([status, color]) => (
                    <div 
                      key={status} 
                      className="flex items-center justify-between p-2 transition-colors duration-150 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => {
                        const newSelected = new Set(selectedStatuses);
                        if (selectedStatuses.has(status)) {
                          newSelected.delete(status);
                        } else {
                          newSelected.add(status);
                        }
                        setSelectedStatuses(newSelected);
                      }}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="flex-shrink-0 w-3.5 h-3.5 border-2 border-gray-300 rounded-full shadow-sm dark:border-gray-600"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-medium leading-tight text-gray-700 dark:text-gray-300">
                          {status}
                        </span>
                      </div>
                      
                      {/* Custom Toggle Switch with Smooth Animation */}
                      <div
                        className={`relative w-9 h-5 rounded-full transition-all duration-300 ease-in-out ${
                          selectedStatuses.has(status)
                            ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-inner'
                            : 'bg-gray-300 dark:bg-gray-600 shadow-inner'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 ease-in-out ${
                            selectedStatuses.has(status) ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 space-x-2">
                  <button
                    onClick={() => {
                      setSelectedSports(new Set(availableSports));
                    }}
                    className="px-2 py-1 text-xs transition-colors rounded-lg text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedSports(new Set())}
                    className="px-2 py-1 text-xs text-gray-700 transition-colors bg-gray-100 rounded-lg dark:bg-gray-900/30 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-900/50"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="pr-1 space-y-1 overflow-y-auto max-h-48">
                  {availableSports.map((sport) => (
                    <div 
                      key={sport} 
                      className="flex items-center justify-between p-2 transition-colors duration-150 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => {
                        const newSelected = new Set(selectedSports);
                        if (selectedSports.has(sport)) {
                          newSelected.delete(sport);
                        } else {
                          newSelected.add(sport);
                        }
                        setSelectedSports(newSelected);
                      }}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="flex-shrink-0 w-3.5 h-3.5 border-2 border-gray-300 rounded-full shadow-sm dark:border-gray-600 bg-blue-500"
                        />
                        <span className="text-sm font-medium leading-tight text-gray-700 dark:text-gray-300">
                          {sport}
                        </span>
                      </div>
                      
                      {/* Custom Toggle Switch with Smooth Animation */}
                      <div
                        className={`relative w-9 h-5 rounded-full transition-all duration-300 ease-in-out ${
                          selectedSports.has(sport)
                            ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-inner'
                            : 'bg-gray-300 dark:bg-gray-600 shadow-inner'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-300 ease-in-out ${
                            selectedSports.has(sport) ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {geojsonData && (
              <div className="p-3 pt-4 mt-4 text-xs text-gray-600 border-t border-gray-200 rounded-lg dark:border-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30">
                <p className="font-medium text-center">
                  Showing <span className="text-green-600 dark:text-green-400">{filteredGeojsonData?.features?.length || 0}</span> of <span className="text-gray-800 dark:text-gray-200">{geojsonData.features.length}</span> venues
                </p>
                {(isStatusFilterActive || isSportsFilterActive) && (
                  <p className="mt-1 text-xs text-center">
                    {isStatusFilterActive && isSportsFilterActive ? 'Status & Sports filters active' :
                     isStatusFilterActive ? 'Status filter active' : 'Sports filter active'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Venue Popup for Globe */}
        {selectedVenue && popupVisible && (
          <div 
            className="absolute max-w-sm bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] dark:bg-gray-800 dark:border-gray-600 w-80 popup-content"
            style={{
              left: Math.min(popupPosition.x, window.innerWidth - 350),
              top: Math.min(popupPosition.y, window.innerHeight - 400),
              maxHeight: '400px'
            }}
          >
            <div className="flex items-start justify-between p-4 pb-2 border-b border-gray-200 dark:border-gray-600">
              <div className="flex-1 mr-2">
                <h3 className="text-lg font-bold leading-tight text-gray-800 dark:text-gray-200">
                  {(() => {
                    const names = selectedVenue.properties.associated_names;
                    if (Array.isArray(names) && names.length > 0) {
                      return names[0];
                    } else if (typeof names === 'string') {
                      // Handle string that might be a JSON array
                      try {
                        const parsed = JSON.parse(names);
                        return Array.isArray(parsed) ? parsed[0] : names;
                      } catch {
                        return names;
                      }
                    }
                    return 'Olympic Venue';
                  })()}
                </h3>
                
                {/* Multiple names indicator and toggle */}
                {(() => {
                  const names = selectedVenue.properties.associated_names;
                  let nameArray = [];
                  
                  if (Array.isArray(names)) {
                    nameArray = names;
                  } else if (typeof names === 'string') {
                    try {
                      const parsed = JSON.parse(names);
                      nameArray = Array.isArray(parsed) ? parsed : [names];
                    } catch {
                      nameArray = [names];
                    }
                  }
                  
                  return nameArray.length > 1 && (
                    <button
                      onClick={() => setExpandedDescription(!expandedDescription)}
                      className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {expandedDescription ? 'Show less' : `+${nameArray.length - 1} more names`}
                    </button>
                  );
                })()}
                
                {/* Expanded names list */}
                {expandedDescription && (() => {
                  const names = selectedVenue.properties.associated_names;
                  let nameArray = [];
                  
                  if (Array.isArray(names)) {
                    nameArray = names;
                  } else if (typeof names === 'string') {
                    try {
                      const parsed = JSON.parse(names);
                      nameArray = Array.isArray(parsed) ? parsed : [names];
                    } catch {
                      nameArray = [names];
                    }
                  }
                  
                  return nameArray.length > 1 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">All associated names:</div>
                      {nameArray.slice(1).map((name, index) => (
                        <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          • {name}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              
              <button
                onClick={() => {
                  setSelectedVenue(null);
                  setPopupVisible(false);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                  <br />
                  <span 
                    className="inline-block px-2 py-1 mt-1 text-xs font-medium text-white rounded-full"
                    style={{ backgroundColor: getStatusColor(selectedVenue.properties.status) }}
                  >
                    {selectedVenue.properties.status || 'No status data'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Location:</span>
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedVenue.properties.district || 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Sports */}
              {selectedVenue.properties.sports && (
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sports:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const sports = selectedVenue.properties.sports;
                      let sportsArray = [];
                      
                      if (Array.isArray(sports)) {
                        sportsArray = sports;
                      } else if (typeof sports === 'string') {
                        try {
                          const parsed = JSON.parse(sports);
                          sportsArray = Array.isArray(parsed) ? parsed : [sports];
                        } catch {
                          sportsArray = [sports];
                        }
                      }
                      
                      return sportsArray.map((sport, index) => (
                        <span key={index} className="inline-block px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/50 dark:text-blue-200">
                          {sport}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}
              
              {/* Timeline mode: Show Olympics info */}
              {timelineMode && selectedVenue.properties.olympics_game && (
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Olympics:</span>
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedVenue.properties.olympics_game}
                  </span>
                </div>
              )}
              
              {/* Additional properties */}
              {selectedVenue.properties.architect && (
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Architect:</span>
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedVenue.properties.architect}
                  </span>
                </div>
              )}
              
              {selectedVenue.properties.capacity && (
                <div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Capacity:</span>
                  <br />
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedVenue.properties.capacity}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Panel - Always visible at bottom */}
        <div 
          data-panel="timeline-panel"
          className="absolute bottom-4 right-4 z-[9999] glass rounded-xl shadow-lg transition-all duration-300 ease-in-out h-[88px]"
          style={{ width: '500px' }}
        >
          <div className="flex flex-col justify-between h-full p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200">Olympic Timeline</h3>
                {/* Selected games info moved here */}
                <div className="text-xs">
                  {timelineMode ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      {filteredGames.length} games selected
                      {loading && (
                        <span className="inline-flex items-center gap-1 ml-2 text-gray-500">
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      Single game mode
                      {loading && (
                        <span className="inline-flex items-center gap-1 text-blue-500">
                          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timelineStartYear} - {timelineEndYear}
                </span>
                {timelineMode ? (
                  <button
                    onClick={clearTimelineMode}
                    className="px-2 py-1 text-xs font-medium text-red-600 transition-colors rounded-md dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Exit timeline mode"
                  >
                    Exit
                  </button>
                ) : (
                  <button
                    onClick={enableTimelineMode}
                    className="px-2 py-1 text-xs font-medium text-blue-600 transition-colors rounded-md dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="Enter timeline mode"
                  >
                    Timeline
                  </button>
                )}
              </div>
            </div>
            
            {/* Interactive Timeline */}
            <div className="relative flex-1">
              <div 
                className="relative h-2 bg-gray-200 rounded-full cursor-pointer dark:bg-gray-600"
                onClick={handleTimelineTrackInteraction}
                onTouchStart={handleTimelineTrackInteraction}
              >
                {/* Selected range highlight */}
                <div 
                  className="absolute h-2 bg-blue-500 rounded-full"
                  style={{
                    left: `${((timelineStartYear - 1896) / (2018 - 1896)) * 100}%`,
                    width: `${((timelineEndYear - timelineStartYear) / (2018 - 1896)) * 100}%`
                  }}
                ></div>
                
                {/* Olympics markers */}
                {availableOlympics.map((olympics) => {
                  const position = ((parseInt(olympics.year) - 1896) / (2018 - 1896)) * 100;
                  const isInRange = parseInt(olympics.year) >= timelineStartYear && parseInt(olympics.year) <= timelineEndYear;
                  
                  return (
                    <div
                      key={olympics.id}
                      className={`absolute top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-200 ${
                        timelineMode && isInRange 
                          ? olympics.season === 'Summer' 
                            ? 'bg-amber-400 dark:bg-amber-300 shadow-sm hover:scale-125' 
                            : 'bg-cyan-400 dark:bg-cyan-300 shadow-sm hover:scale-125'
                          : 'bg-gray-300 dark:bg-gray-600 opacity-60'
                      }`}
                      style={{ left: `calc(${position}% - 3px)` }}
                      title={`${olympics.year} ${olympics.city} (${olympics.season})`}
                    ></div>
                  );
                })}
                
                {/* Draggable Start Marker */}
                <div
                  className="absolute w-4 h-4 transform -translate-y-1/2 bg-blue-600 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing top-1/2"
                  style={{ left: `calc(${((timelineStartYear - 1896) / (2018 - 1896)) * 100}% - 8px)` }}
                  onMouseDown={(e) => handleTimelineMouseDown(e, 'start')}
                  onTouchStart={(e) => handleTimelineTouchStart(e, 'start')}
                  title={`Start: ${timelineStartYear}`}
                >
                  {showStartLabel && (
                    <div className="absolute px-2 py-1 text-xs text-white transform -translate-x-1/2 bg-blue-600 rounded shadow-lg -top-8 left-1/2 whitespace-nowrap">
                      {timelineStartYear}
                    </div>
                  )}
                </div>
                
                {/* Draggable End Marker */}
                <div
                  className="absolute w-4 h-4 transform -translate-y-1/2 bg-blue-600 border-2 border-white rounded-full shadow-lg cursor-grab active:cursor-grabbing top-1/2"
                  style={{ left: `calc(${((timelineEndYear - 1896) / (2018 - 1896)) * 100}% - 8px)` }}
                  onMouseDown={(e) => handleTimelineMouseDown(e, 'end')}
                  onTouchStart={(e) => handleTimelineTouchStart(e, 'end')}
                  title={`End: ${timelineEndYear}`}
                >
                  {showEndLabel && (
                    <div className="absolute px-2 py-1 text-xs text-white transform -translate-x-1/2 bg-blue-600 rounded shadow-lg -top-8 left-1/2 whitespace-nowrap">
                      {timelineEndYear}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panel - Dynamic Width and Expandable Status Breakdown */}
        {geojsonData && geojsonData.features && geojsonData.features.length > 0 && (
          <div 
            className={`absolute bottom-4 left-4 z-[9999] glass rounded-xl shadow-lg transition-all duration-300 ease-in-out ${getDynamicWidth()}`}
            style={{ maxWidth: '70vw' }}
          >
            <div className="flex">
              {/* Main Info Panel - Fixed Height */}
              <div className="flex-shrink-0 px-4 py-3 h-[88px]">
                <div className="flex flex-col justify-center h-full text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between h-full">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {timelineMode && filteredGames.length > 0 ? (
                          `${geojsonData.features.length} venues from ${filteredGames.length} Olympic Games (${timelineStartYear}-${timelineEndYear})`
                        ) : (
                          `${geojsonData.features.length} Olympic venues from ${availableOlympics.find(o => o.id === selectedOlympics)?.name || 'Olympics'}`
                        )}
                      </p>
                      <p className="flex items-center gap-1 mt-1">
                        <span>💡</span>
                        <span>Click markers for details</span>
                      </p>
                      <p className="flex items-center gap-1 mt-1">
                        <span>🌍</span>
                        <span>Drag to rotate globe</span>
                      </p>
                    </div>
                    
                    {/* Status Breakdown Toggle Button */}
                    <button
                      onClick={() => setExpandedStatusBreakdown(!expandedStatusBreakdown)}
                      className="p-2 ml-3 text-gray-500 transition-all duration-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      title={expandedStatusBreakdown ? "Hide status breakdown" : "Show status breakdown"}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        className={`transition-transform duration-300 ${expandedStatusBreakdown ? 'rotate-180' : ''}`}
                      >
                        <polyline points="9,18 15,12 9,6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expandable Status Breakdown - Horizontal with Smooth Animation */}
              <div 
                className={`transition-all duration-500 ease-in-out border-l border-gray-200 dark:border-gray-600 h-[88px] ${
                  expandedStatusBreakdown ? 'max-w-screen-sm opacity-100' : 'max-w-0 opacity-0'
                }`}
              >
                <div className="h-full px-4 py-3 overflow-hidden">
                  <h4 className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Venue Status Breakdown
                  </h4>
                  <div 
                    className="flex flex-wrap gap-1 overflow-y-auto max-h-12 custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(156, 163, 175, 0.5) transparent'
                    }}
                  >
                    <style jsx>{`
                      .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                      }
                      .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                        transform: translateY(-3px);
                      }
                      .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(156, 163, 175, 0.5);
                        border-radius: 3px;
                        border: none;
                        transform: translateY(-3px);
                      }
                      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(156, 163, 175, 0.7);
                      }
                      .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(75, 85, 99, 0.5);
                      }
                      .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(75, 85, 99, 0.7);
                      }
                    `}</style>
                    {getStatusBreakdown().map((item, index) => (
                      <div 
                        key={index} 
                        className="flex items-center flex-shrink-0 gap-1 px-2 py-1 transition-colors rounded bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div 
                          className="flex-shrink-0 w-2 h-2 border border-white rounded-full shadow-sm"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-xs text-gray-700 truncate dark:text-gray-300">
                          {item.status}
                        </span>
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 px-1 py-0.5 rounded-full shadow-sm min-w-[20px] text-center">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                  {getStatusBreakdown().length === 0 && (
                    <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
                      No status data available for these venues
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

GlobeView.displayName = 'GlobeView';

export default GlobeView;
