'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import MapWithLayers from './MapWithLayers';
import ChartsPanel from './ChartsPanel';

const MapWithChartsLayout = () => {
  // Hydration-safe state
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Initialize with defaults, will be updated after hydration
  const [geojsonData, setGeojsonData] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const [timelineData, setTimelineData] = useState(null);
  const mapRef = useRef(null);

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
          console.warn('Failed to parse saved charts state:', e);
        }
      }
    }
  }, []);
  
  // This function will be passed to MapWithLayers to get data updates
  const handleDataUpdate = useCallback((data) => {
    setGeojsonData(data);
  }, []);

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
    <div className="flex h-full max-h-full gap-4">
      {/* Map Container - Takes remaining space */}
      <div className={`transition-all duration-500 ease-in-out ${showCharts ? 'w-2/3' : 'w-full'} bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-600/50 overflow-hidden flex flex-col`}>
        <div className="flex-1 w-full min-h-0 overflow-hidden map-container rounded-xl">
          <MapWithLayers 
            onDataUpdate={handleDataUpdate} 
            onChartsToggle={handleChartsToggle}
            onTimelineDataUpdate={handleTimelineDataUpdate}
            showCharts={showCharts}
          />
        </div>
      </div>
      
      {/* Charts Container - Fixed width, only show when showCharts is true */}
      {showCharts && (
        <div className="w-1/3 p-4 transition-all duration-500 ease-in-out border shadow-lg bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-gray-200/50 dark:border-gray-600/50">
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
