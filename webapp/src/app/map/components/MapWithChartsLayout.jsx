'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import MapWithLayers from './MapWithLayers';
import ChartsPanel from './ChartsPanel';
import logger from '@/components/logger';

const MapWithChartsLayout = ({ onDataUpdate, viewMode, toggleViewMode }) => {
  // Hydration-safe state
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Initialize with defaults, will be updated after hydration
  const [geojsonData, setGeojsonData] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const mapRef = useRef(null);
  
  // Resizable state
  const [mapWidth, setMapWidth] = useState(66.67); // Start at 2/3 (66.67%)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  
  // Minimum widths (percentage)
  const MIN_MAP_WIDTH = 30;
  const MIN_CHARTS_WIDTH = 20;

  // Hydration effect - load saved values after component mounts
  useEffect(() => {
    setIsHydrated(true);
    
    // Load saved chart visibility from sessionStorage
    if (typeof window !== 'undefined') {
      const savedShowCharts = sessionStorage.getItem('olympics-show-charts');
      if (savedShowCharts) {
        try {
          setShowCharts(JSON.parse(savedShowCharts));
        } catch (e) {
            logger.warn('Failed to parse saved charts state:', e);
        }
      }
      
      // Load saved map width from sessionStorage
      const savedMapWidth = sessionStorage.getItem('olympics-map-width');
      if (savedMapWidth) {
        try {
          const width = parseFloat(savedMapWidth);
          if (width >= MIN_MAP_WIDTH && width <= (100 - MIN_CHARTS_WIDTH)) {
            setMapWidth(width);
          }
        } catch (e) {
            logger.warn('Failed to parse saved map width:', e);
        }
      }
    }
  }, []);
  
  // This function will be passed to MapWithLayers to get data updates
  const handleDataUpdate = useCallback((data) => {
    setGeojsonData(data);
    // Pass data up to parent component
    if (onDataUpdate) {
      onDataUpdate(data);
    }
  }, [onDataUpdate]);

  // This function will be passed to MapWithLayers to handle chart toggle
  const handleChartsToggle = useCallback((show) => {
    setShowCharts(show);
  }, []);

  // This function will be passed to MapWithLayers to get timeline data updates
  const handleTimelineDataUpdate = useCallback((timelineInfo) => {
    setTimelineData(timelineInfo);
  }, []);

  // Save showCharts state to sessionStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('olympics-show-charts', JSON.stringify(showCharts));
    }
  }, [showCharts, isHydrated]);
  
  // Save mapWidth state to sessionStorage whenever it changes (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      sessionStorage.setItem('olympics-map-width', mapWidth.toString());
    }
  }, [mapWidth, isHydrated]);

  // Handle mouse/touch events for resizing
  const handleMouseDown = useCallback((e) => {
    if (!showCharts) return;
    setIsDragging(true);
    e.preventDefault();
  }, [showCharts]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current || !showCharts) return;
    
    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const newMapWidth = ((clientX - containerRect.left) / containerRect.width) * 100;
    
    // Apply constraints
    const constrainedWidth = Math.max(
      MIN_MAP_WIDTH,
      Math.min(100 - MIN_CHARTS_WIDTH, newMapWidth)
    );
    
    setMapWidth(constrainedWidth);
  }, [isDragging, showCharts]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners for mouse/touch events
  useEffect(() => {
    if (isDragging) {
      const handleMove = (e) => handleMouseMove(e);
      const handleUp = () => handleMouseUp();
      
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Function to get status breakdown from geojson data
  const getStatusBreakdown = useCallback(() => {
    if (!geojsonData || !geojsonData.features) return [];

    const statusCounts = {};
    const statusColors = {
      'In use': '#22c55e',
      'In use (rebuilt)': '#10b981',
      'In use (repurposed)': '#06b6d4',
      'In use (seasonal)': '#3b82f6',
      'In use (limited)': '#8b5cf6',
      'Not in use': '#ef4444',
      'Not in use (demolished)': '#dc2626',
      'Dismantled (temporary)': '#991b1b',
      'Dismantled (seasonal)': '#7c2d12',
      'No status data': '#94a3b8'
    };

    geojsonData.features.forEach(feature => {
      const status = feature.properties.status || 'No status data';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        color: statusColors[status] || '#94a3b8'
      }))
      .sort((a, b) => b.count - a.count);
  }, [geojsonData]);

  return (
    <div 
      ref={containerRef} 
      className={`flex h-full max-h-full relative ${isDragging ? 'resizing no-select' : ''}`}
    >
      {/* Map Container - Dynamic width based on mapWidth state */}
      <div 
        className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-600/50 overflow-hidden flex flex-col transition-none"
        style={{ 
          width: showCharts ? `${mapWidth}%` : '100%'
        }}
      >
        <div className="flex-1 w-full min-h-0 overflow-hidden map-container rounded-xl">
          <MapWithLayers 
            onDataUpdate={handleDataUpdate} 
            onChartsToggle={handleChartsToggle}
            onTimelineDataUpdate={handleTimelineDataUpdate}
            showCharts={showCharts}
            viewMode={viewMode}
            toggleViewMode={toggleViewMode}
          />
        </div>
      </div>
      
      {/* Resizer Handle - Only show when charts are visible */}
      {showCharts && (
        <div
          className={`
            w-1 bg-gray-600 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-500 
            cursor-col-resize transition-all duration-200 flex-shrink-0 mx-2 group rounded-full
            shadow-sm hover:shadow-md active:shadow-lg
            ${isDragging ? 'bg-gray-800 dark:bg-gray-500 shadow-lg' : ''}
          `}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          title="Drag to resize panels"
        >
          {/* Visual handle indicator */}
          <div className="h-full w-full relative flex items-center justify-center">
            <div className="flex flex-col gap-0.5">
              <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-400 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-200"></div>
              <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-400 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-200"></div>
              <div className="w-0.5 h-2 bg-gray-300 dark:bg-gray-400 rounded-full opacity-70 group-hover:opacity-100 transition-all duration-200"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Charts Container - Dynamic width based on remaining space */}
      {showCharts && (
        <div 
          className="p-4 border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50 transition-none"
          style={{ 
            width: `${100 - mapWidth}%`
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  📊 Analytics Dashboard
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCharts(false);
                  // This will trigger the map component to update its state too
                }}
                className="p-2 text-gray-400 transition-all rounded hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChartsPanel 
                geojsonData={geojsonData} 
                getStatusBreakdown={getStatusBreakdown}
                timelineData={timelineData}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapWithChartsLayout;
