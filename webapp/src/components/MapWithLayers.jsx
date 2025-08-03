'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Map, { NavigationControl, ScaleControl, GeolocateControl, Source, Layer, Popup } from 'react-map-gl/maplibre';

const MapWithLayers = () => {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: 4.9,
    latitude: 52.37,
    zoom: 11
  });

  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedMapStyle, setSelectedMapStyle] = useState('openstreetmap');
  const [selectedOlympics, setSelectedOlympics] = useState('1928_Amsterdam');
  const [loading, setLoading] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showOlympicsPanel, setShowOlympicsPanel] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  // Available Olympic Games
  const availableOlympics = [
    { 
      id: '1924_Paris', 
      name: '1924 Paris Olympics', 
      year: '1924',
      city: 'Paris',
      center: [2.35, 48.85], // Paris coordinates
      zoom: 11
    },
    { 
      id: '1928_Amsterdam', 
      name: '1928 Amsterdam Olympics', 
      year: '1928', 
      city: 'Amsterdam',
      center: [4.9, 52.37], // Amsterdam coordinates
      zoom: 11
    }
  ];

  // Available map styles with free tile sources
  const mapStyles = [
    { 
      id: 'countries', 
      name: 'Countries View', 
      url: 'https://demotiles.maplibre.org/style.json',
      description: 'Clean country boundaries view'
    },
    {
      id: 'openstreetmap',
      name: 'Streets & Cities',
      url: 'https://tiles.openfreemap.org/styles/liberty',
      description: 'Detailed streets and city labels'
    },
    {
      id: 'satellite',
      name: 'Satellite',
      url: {
        "version": 8,
        "sources": {
          "satellite": {
            "type": "raster",
            "tiles": ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            "tileSize": 256,
            "attribution": "© Esri, Maxar, Earthstar Geographics"
          }
        },
        "layers": [
          {
            "id": "satellite",
            "type": "raster",
            "source": "satellite"
          }
        ]
      },
      description: 'Real satellite imagery'
    },
    {
      id: 'positron',
      name: 'Light Theme',
      url: 'https://tiles.openfreemap.org/styles/positron',
      description: 'Clean light background'
    }
  ];

  useEffect(() => {
    loadOlympicsData(selectedOlympics);
  }, [selectedOlympics]);

  // Click outside to close panels
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Get all elements that should NOT close the panels when clicked
      const layerButton = event.target.closest('[data-panel="layer-button"]');
      const layerPanel = event.target.closest('[data-panel="layer-panel"]');
      const olympicsButton = event.target.closest('[data-panel="olympics-button"]');
      const olympicsPanel = event.target.closest('[data-panel="olympics-panel"]');
      
      // Close layer panel if click is outside both button and panel
      if (showLayerPanel && !layerButton && !layerPanel) {
        setShowLayerPanel(false);
      }
      
      // Close olympics panel if click is outside both button and panel
      if (showOlympicsPanel && !olympicsButton && !olympicsPanel) {
        setShowOlympicsPanel(false);
      }
    };

    // Add event listener to document
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLayerPanel, showOlympicsPanel]);

  const loadOlympicsData = async (olympicsId) => {
    setLoading(true);
    setSelectedVenue(null); // Clear any open popup
    try {
      const response = await fetch(`/data/${olympicsId}.geojson`);
      const data = await response.json();
      
      // First update the data
      setGeojsonData(data);
      
      // Then animate to the new location using MapLibre's native flyTo
      const olympics = availableOlympics.find(o => o.id === olympicsId);
      if (olympics && mapRef.current) {
        const map = mapRef.current.getMap();
        
        // Use MapLibre GL's native flyTo method for smooth animation
        map.flyTo({
          center: [olympics.center[0], olympics.center[1]],
          zoom: olympics.zoom,
          duration: 2500, // 2.5 seconds
          essential: true, // This animation is considered essential with respect to prefers-reduced-motion
          easing: (t) => {
            // Custom easing function for smooth start and end
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          }
        });
        
        // Update the viewState to keep it in sync (this won't cause a jump since flyTo is already animating)
        setTimeout(() => {
          setViewState(prev => ({
            ...prev,
            longitude: olympics.center[0],
            latitude: olympics.center[1],
            zoom: olympics.zoom
          }));
        }, 2500); // After animation completes
      }
    } catch (error) {
      console.error('Error loading Olympics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOlympicsChange = (olympicsId) => {
    setSelectedOlympics(olympicsId);
  };

  const onMove = useCallback((evt) => {
    setViewState(evt.viewState);
  }, []);

  const onClick = useCallback((event) => {
    const feature = event.features?.[0];
    if (feature && feature.source === 'olympic-venues') {
      const newSelectedVenue = {
        longitude: feature.geometry.coordinates[0],
        latitude: feature.geometry.coordinates[1],
        properties: feature.properties
      };
      setSelectedVenue(newSelectedVenue);
      setExpandedDescription(false);
    }
  }, []);

  const getCurrentMapStyle = () => {
    const style = mapStyles.find(s => s.id === selectedMapStyle);
    return style ? style.url : mapStyles[0].url;
  };

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
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner">
      <Map
        ref={mapRef}
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
        {geojsonData && (
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
            closeButton={false}
            closeOnClick={false}
            className="venue-popup"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 max-w-sm w-80 popup-content">
              <div className="flex justify-between items-start p-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                <div className="flex-1 mr-2">
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 leading-tight">
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
                  {/* Show alternative names if available */}
                  {(() => {
                    const names = selectedVenue.properties.associated_names;
                    let nameArray = [];
                    
                    if (Array.isArray(names)) {
                      nameArray = names;
                    } else if (typeof names === 'string') {
                      try {
                        const parsed = JSON.parse(names);
                        nameArray = Array.isArray(parsed) ? parsed : [];
                      } catch {
                        nameArray = [];
                      }
                    }
                    
                    return nameArray.length > 1 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Also known as: {nameArray.slice(1).join(', ')}
                      </p>
                    );
                  })()}
                </div>
                <button
                  onClick={() => {
                    setSelectedVenue(null);
                    setExpandedDescription(false);
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold leading-none p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200 transform hover:scale-110"
                  title="Close"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Location */}
                {selectedVenue.properties.place && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 mb-1">
                      📍 Location
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-1">{selectedVenue.properties.place}</p>
                  </div>
                )}
                
                {/* Sports */}
                {selectedVenue.properties.sports && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 mb-2">
                      🏃 Sports
                    </span>
                    <div className="flex flex-wrap gap-1 ml-1">
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
                          <span 
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-md transition-all duration-200 cursor-default transform hover:scale-105"
                            title={sport}
                          >
                            {sport}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Type */}
                {selectedVenue.properties.type && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 mb-1">
                      🏢 Type
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-1 capitalize">{selectedVenue.properties.type}</p>
                  </div>
                )}
                
                {/* Additional info if available */}
                {selectedVenue.properties.venue_information && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 mb-1">
                      ℹ️ Details
                    </span>
                    <div className="ml-1">
                      <div className="transition-all duration-300 ease-in-out">
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {expandedDescription || selectedVenue.properties.venue_information.length <= 200
                            ? selectedVenue.properties.venue_information
                            : selectedVenue.properties.venue_information.substring(0, 200) + '...'}
                        </p>
                      </div>
                      {selectedVenue.properties.venue_information.length > 200 && (
                        <button
                          onClick={() => setExpandedDescription(!expandedDescription)}
                          className="text-blue-500 hover:text-blue-700 text-xs mt-2 underline transition-colors duration-200 hover:bg-blue-50 px-1 py-0.5 rounded"
                        >
                          {expandedDescription ? '▲ Show less' : '▼ Show more'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Control Buttons */}
      <div className="absolute top-4 left-4 space-y-2">
        {/* Map Layer Control Button */}
        <button
          data-panel="layer-button"
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="glass p-3 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 block"
          title="Change map style"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5"></polygon>
            <polyline points="16,11.37 12,9.27 8,11.37"></polyline>
            <polyline points="16,15.37 12,13.27 8,15.37"></polyline>
          </svg>
        </button>

        {/* Olympics Control Button */}
        <button
          data-panel="olympics-button"
          onClick={() => setShowOlympicsPanel(!showOlympicsPanel)}
          className="glass p-3 rounded-xl shadow-lg hover:scale-105 transition-all duration-300 block"
          title="Switch Olympic Games"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700 dark:text-gray-300">
            <circle cx="12" cy="8" r="6"></circle>
            <circle cx="8" cy="14" r="3"></circle>
            <circle cx="16" cy="14" r="3"></circle>
          </svg>
        </button>

        {/* Map Layer Selection Panel */}
        {showLayerPanel && (
          <div 
            data-panel="layer-panel"
            className="absolute top-0 left-16 glass p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 min-w-64 z-10"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Map Style</h3>
              <button
                onClick={() => setShowLayerPanel(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {mapStyles.map(style => (
                <label key={style.id} className="flex items-start cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="mapStyle"
                    value={style.id}
                    checked={selectedMapStyle === style.id}
                    onChange={(e) => {
                      setSelectedMapStyle(e.target.value);
                      setShowLayerPanel(false);
                    }}
                    className="mr-3 mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium block text-gray-800 dark:text-gray-200">{style.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{style.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Olympics Selection Panel */}
        {showOlympicsPanel && (
          <div 
            data-panel="olympics-panel"
            className="absolute top-0 left-16 glass p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 min-w-72 z-10 max-h-96 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Olympic Games</h3>
              <button
                onClick={() => setShowOlympicsPanel(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {availableOlympics.map(olympics => (
                <label key={olympics.id} className="flex items-start cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="olympics"
                    value={olympics.id}
                    checked={selectedOlympics === olympics.id}
                    onChange={(e) => {
                      handleOlympicsChange(e.target.value);
                      setShowOlympicsPanel(false);
                    }}
                    className="mr-3 mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium block text-gray-800 dark:text-gray-200">{olympics.name}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{olympics.year} • {olympics.city}</p>
                  </div>
                </label>
              ))}
            </div>
            
            {geojsonData && !loading && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400">
                <p>{geojsonData.features.length} Olympic venues loaded</p>
              </div>
            )}
            
            {loading && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-xs text-blue-600 dark:text-blue-400">
                <p>Loading Olympic venues...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Panel */}
      {geojsonData && (
        <div className="absolute bottom-4 left-4 glass p-4 rounded-xl shadow-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {geojsonData.features.length} Olympic venues from {availableOlympics.find(o => o.id === selectedOlympics)?.name || 'Olympics'}
            </p>
            <p className="mt-1 flex items-center gap-1">
              <span>💡</span>
              <span>Click orange markers for details</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapWithLayers;
