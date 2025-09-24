'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Map, { NavigationControl, ScaleControl, GeolocateControl, Source, Layer, Popup } from 'react-map-gl/maplibre';
import logger from '@/components/logger';

const InteractiveOlympicMap = () => {
  const [viewState, setViewState] = useState({
    longitude: 4.9,
    latitude: 52.37,
    zoom: 2
  });

  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState('1928_Amsterdam');
  const [selectedMapStyle, setSelectedMapStyle] = useState('countries');
  const [loading, setLoading] = useState(false);

  const availableDatasets = [
    { id: '1928_Amsterdam', name: '1928 Amsterdam Olympics', center: [4.9, 52.37] }
    // You can add more datasets here as they become available
  ];

  const mapStyles = [
    { 
      id: 'countries', 
      name: 'Countries View', 
      url: 'https://demotiles.maplibre.org/style.json',
      description: 'Clean country boundaries view'
    },
    { 
      id: 'osm-bright', 
      name: 'Streets & Cities', 
      url: {
        "version": 8,
        "sources": {
          "osm": {
            "type": "raster",
            "tiles": ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "© OpenStreetMap contributors"
          }
        },
        "layers": [
          {
            "id": "osm",
            "type": "raster",
            "source": "osm"
          }
        ]
      },
      description: 'OpenStreetMap with streets and cities'
    },
    { 
      id: 'carto-positron', 
      name: 'Light Theme', 
      url: {
        "version": 8,
        "sources": {
          "carto": {
            "type": "raster",
            "tiles": ["https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "© CARTO"
          }
        },
        "layers": [
          {
            "id": "carto",
            "type": "raster",
            "source": "carto"
          }
        ]
      },
      description: 'Clean light theme'
    },
    { 
      id: 'carto-dark', 
      name: 'Dark Theme', 
      url: {
        "version": 8,
        "sources": {
          "carto-dark": {
            "type": "raster",
            "tiles": ["https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"],
            "tileSize": 256,
            "attribution": "© CARTO"
          }
        },
        "layers": [
          {
            "id": "carto-dark",
            "type": "raster",
            "source": "carto-dark"
          }
        ]
      },
      description: 'Dark theme for night viewing'
    }
  ];

  const getCurrentMapStyle = () => {
    const style = mapStyles.find(s => s.id === selectedMapStyle);
    return style ? style.url : mapStyles[0].url;
  };

  const loadDataset = useCallback(async (datasetId) => {
    setLoading(true);
    try {
      const response = await fetch(`/data/${datasetId}.geojson`);
      const data = await response.json();
      setGeojsonData(data);
      
      // Update map view to center on the data
      const dataset = availableDatasets.find(d => d.id === datasetId);
      if (dataset) {
        setViewState(prev => ({
          ...prev,
          longitude: dataset.center[0],
          latitude: dataset.center[1],
          zoom: 10
        }));
      }
    } catch (error) {
        logger.error('Error loading dataset:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDataset(selectedDataset);
  }, [selectedDataset, loadDataset]);

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

  const handleDatasetChange = (datasetId) => {
    setSelectedDataset(datasetId);
    setSelectedVenue(null); // Clear any open popup
  };

  const handleMapStyleChange = (styleId) => {
    setSelectedMapStyle(styleId);
    setSelectedVenue(null); // Clear any open popup
  };

  // Layer styles
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
    <div className="relative w-full h-[600px] border rounded-lg overflow-hidden">
      <Map
        {...viewState}
        onMove={onMove}
        onClick={onClick}
        style={{ width: '100%', height: '100%' }}
        mapStyle={getCurrentMapStyle()}
        attributionControl={true}
        cooperativeGestures={true}
        interactiveLayerIds={['olympic-venues']}
      >
        {/* Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-left" />
        <GeolocateControl position="top-right" />

        {/* Data Layer */}
        {geojsonData && !loading && (
          <Source id="olympic-venues" type="geojson" data={geojsonData}>
            <Layer {...pointLayerStyle} />
          </Source>
        )}

        {/* Popup */}
        {selectedVenue && (
          <Popup
            longitude={selectedVenue.longitude}
            latitude={selectedVenue.latitude}
            anchor="bottom"
            onClose={() => setSelectedVenue(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 max-w-sm">
              <h3 className="font-bold text-base mb-2 text-gray-800">
                {selectedVenue.properties.associated_names?.[0] || 'Olympic Venue'}
              </h3>
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-semibold text-gray-700">Location:</span> {selectedVenue.properties.place}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Sports:</span> {selectedVenue.properties.sports?.join(', ')}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Type:</span> {selectedVenue.properties.type}
                </div>
                {selectedVenue.properties.venue_use && (
                  <div>
                    <span className="font-semibold text-gray-700">Use:</span> {selectedVenue.properties.venue_use}
                  </div>
                )}
                {selectedVenue.properties.venue_information && (
                  <div>
                    <span className="font-semibold text-gray-700">Details:</span>
                    <p className="text-xs mt-1 text-gray-600">
                      {selectedVenue.properties.venue_information.length > 150 
                        ? selectedVenue.properties.venue_information.substring(0, 150) + '...' 
                        : selectedVenue.properties.venue_information}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Dataset Selector */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
        <h3 className="font-bold text-sm mb-2">Olympic Games Dataset</h3>
        <select 
          value={selectedDataset}
          onChange={(e) => handleDatasetChange(e.target.value)}
          className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          disabled={loading}
        >
          {availableDatasets.map(dataset => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>

        <h3 className="font-bold text-sm mb-2">Map Layer</h3>
        <select 
          value={selectedMapStyle}
          onChange={(e) => handleMapStyleChange(e.target.value)}
          className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {mapStyles.map(style => (
            <option key={style.id} value={style.id}>
              {style.name}
            </option>
          ))}
        </select>
        
        {loading && (
          <p className="text-xs text-blue-600 mt-2">Loading data...</p>
        )}
        
        {geojsonData && !loading && (
          <div className="mt-2 text-xs text-gray-600">
            <p>{geojsonData.features.length} venues loaded</p>
            <p className="mt-1">💡 Click markers for details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveOlympicMap;
