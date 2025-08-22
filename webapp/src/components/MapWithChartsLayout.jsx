'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import MapWithLayers from './MapWithLayers';
import ChartsPanel from './ChartsPanel';

const MapWithChartsLayout = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [showCharts, setShowCharts] = useState(false);
  const mapRef = useRef(null);
  
  // This function will be passed to MapWithLayers to get data updates
  const handleDataUpdate = useCallback((data) => {
    setGeojsonData(data);
  }, []);

  // This function will be passed to MapWithLayers to handle chart toggle
  const handleChartsToggle = useCallback((show) => {
    setShowCharts(show);
  }, []);

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
    <div className="flex gap-4 h-full max-h-full">
      {/* Map Container - Takes remaining space */}
      <div className={`transition-all duration-500 ease-in-out ${showCharts ? 'w-2/3' : 'w-full'} bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-600/50 overflow-hidden flex flex-col`}>
        <div className="map-container rounded-xl overflow-hidden flex-1 min-h-0 w-full">
          <MapWithLayers 
            onDataUpdate={handleDataUpdate} 
            onChartsToggle={handleChartsToggle}
            showCharts={showCharts}
          />
        </div>
      </div>
      
      {/* Charts Container - Fixed width, only show when showCharts is true */}
      {showCharts && (
        <div className="w-1/3 bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-600/50 transition-all duration-500 ease-in-out">
          <div className="h-full flex flex-col">
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
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapWithChartsLayout;
