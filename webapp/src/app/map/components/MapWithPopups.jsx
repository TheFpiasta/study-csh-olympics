'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Map, { NavigationControl, ScaleControl, GeolocateControl, Source, Layer, Popup } from 'react-map-gl/maplibre';
import logger from '@/components/logger';

const MapWithPopups = () => {
  const [viewState, setViewState] = useState({
    longitude: 4.9,
    latitude: 52.37,
    zoom: 10
  });

  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);

  useEffect(() => {
    // Load the Amsterdam 1928 Olympics GeoJSON data
    fetch('/data/1928_Amsterdam.geojson')
      .then(response => response.json())
      .then(data => setGeojsonData(data))
        .catch(error => logger.error('Error loading GeoJSON:', error));
  }, []);

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  const onClick = useCallback((event) => {
    const feature = event.features?.[0];
    if (feature && feature.source === 'olympic-venues') {
      setSelectedVenue({
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        properties: feature.properties
      });
    }
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
        onClick={onClick}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://demotiles.maplibre.org/style.json"
        attributionControl={true}
        cooperativeGestures={true}
        interactiveLayerIds={['olympic-venues']}
      >
        {/* Navigation controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />
        <GeolocateControl position="top-right" />

        {/* GeoJSON Data Layer */}
        {geojsonData && (
          <Source id="olympic-venues" type="geojson" data={geojsonData}>
            <Layer {...pointLayerStyle} />
          </Source>
        )}

        {/* Popup for selected venue */}
        {selectedVenue && (
          <Popup
            longitude={selectedVenue.longitude}
            latitude={selectedVenue.latitude}
            anchor="bottom"
            onClose={() => setSelectedVenue(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-sm mb-2">
                {selectedVenue.properties.associated_names?.[0] || 'Olympic Venue'}
              </h3>
              <div className="text-xs space-y-1">
                <p><strong>Place:</strong> {selectedVenue.properties.place}</p>
                <p><strong>Sports:</strong> {selectedVenue.properties.sports?.join(', ')}</p>
                <p><strong>Type:</strong> {selectedVenue.properties.type}</p>
                {selectedVenue.properties.venue_information && (
                  <p><strong>Info:</strong> {selectedVenue.properties.venue_information.substring(0, 100)}...</p>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs opacity-90">
        <h3 className="font-bold text-sm mb-1">Olympic Venues Map</h3>
        <p className="text-xs text-gray-600">
          Showing venues from the 1928 Amsterdam Olympics. Click on a venue to see details.
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

export default MapWithPopups;
