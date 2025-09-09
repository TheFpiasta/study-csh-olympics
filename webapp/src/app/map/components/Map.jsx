'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Map, { NavigationControl, ScaleControl, GeolocateControl, Source, Layer } from 'react-map-gl/maplibre';

const MapComponent = () => {
  const [viewState, setViewState] = useState({
    longitude: 4.9,
    latitude: 52.37,
    zoom: 10
  });

  const [geojsonData, setGeojsonData] = useState(null);

  useEffect(() => {
    // Load the Amsterdam 1928 Olympics GeoJSON data
    fetch('/data/1928_Amsterdam.geojson')
      .then(response => response.json())
      .then(data => setGeojsonData(data))
      .catch(error => console.error('Error loading GeoJSON:', error));
  }, []);

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  // Layer styles for the GeoJSON data
  const pointLayerStyle = {
    id: 'olympic-venues',
    type: 'circle',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ff6b35',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.8
    }
  };

  return (
    <div className="relative w-full h-[500px] border rounded-lg overflow-hidden">
      <Map
        {...viewState}
        onMove={onMove}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://demotiles.maplibre.org/style.json"
        attributionControl={true}
        cooperativeGestures={true}
      >
        {/* Navigation controls (zoom in/out, compass) */}
        <NavigationControl position="top-right" />
        
        {/* Scale control */}
        <ScaleControl position="bottom-left" />
        
        {/* Geolocation control */}
        <GeolocateControl position="top-right" />

        {/* GeoJSON Data Layer */}
        {geojsonData && (
          <Source id="olympic-venues" type="geojson" data={geojsonData}>
            <Layer {...pointLayerStyle} />
          </Source>
        )}
      </Map>
      
      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs opacity-90">
        <h3 className="font-bold text-sm mb-1">Olympic Venues Map</h3>
        <p className="text-xs text-gray-600">
          Showing venues from the 1928 Amsterdam Olympics. Click and drag to navigate, scroll to zoom.
        </p>
        {geojsonData && (
          <p className="text-xs text-blue-600 mt-1">
            Loaded {geojsonData.features.length} venues
          </p>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
