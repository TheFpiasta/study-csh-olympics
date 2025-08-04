# React Map GL with MapLibre GL Integration

This document describes the implementation of interactive maps in the Olympic Venues Web App using `react-map-gl` with MapLibre GL.

## Dependencies Installed

```bash
npm install react-map-gl maplibre-gl
```

## Key Components

### 1. Basic Map Component (`/src/components/Map.jsx`)
A simple map component with basic navigation controls:
- Navigation controls (zoom, compass)
- Scale control
- Geolocation control
- Basic styling and layout

### 2. Map with Popups (`/src/components/MapWithPopups.jsx`)
Enhanced map with interactive features:
- Click events on map features
- Popup windows showing venue details
- GeoJSON data loading and display

### 3. Interactive Olympic Map (`/src/components/InteractiveOlympicMap.jsx`)
Full-featured map component with:
- Dataset selection dropdown
- Dynamic data loading
- Enhanced popups with detailed venue information
- Loading states
- Responsive design

## Features Implemented

### ✅ MapLibre GL Integration
- Uses MapLibre GL as the map rendering engine
- Configured with multiple map styles and tile sources
- Full compatibility with Mapbox GL JS API

### ✅ Multiple Map Layers
- **Countries View**: Clean country boundaries view using MapLibre demo tiles
- **Streets & Cities**: Detailed street maps with city labels using OpenFreeMap
- **Satellite**: Real satellite imagery using Esri World Imagery tiles
- **Light Theme**: Clean light background for better readability
- Compact layer button with popup panel for easy switching

### ✅ GeoJSON Data Loading
- Loads Olympic venue data from GeoJSON files
- Dynamic data fetching based on selected dataset
- Displays venues as interactive markers

### ✅ Interactive Features
- Click to select venues
- Popup windows with detailed information
- Map navigation (pan, zoom, rotate)
- Responsive controls

### ✅ Styling and UI
- Tailwind CSS integration
- Custom marker styling
- Responsive layout
- Modern UI components

## Configuration

### CSS Import
MapLibre GL CSS is imported in `globals.css`:
```css
@import "maplibre-gl/dist/maplibre-gl.css";
```

### Map Style
Using MapLibre's demo tile server:
```javascript
mapStyle="https://demotiles.maplibre.org/style.json"
```

## Data Structure

The app expects GeoJSON files in the `/public/data/` directory with the following structure:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "associated_names": ["venue name"],
        "place": "city",
        "sports": ["sport1", "sport2"],
        "type": "venue type",
        "venue_information": "detailed description"
      }
    }
  ]
}
```

## Usage

1. Navigate to `/map` to view the interactive map
2. Select different Olympic Games from the dropdown (when more datasets are added)
3. Click on orange markers to view venue details
4. Use map controls to navigate

## Next Steps

To extend the functionality:

1. **Add More Datasets**: Copy more GeoJSON files to `/public/data/` and update the `availableDatasets` array in `InteractiveOlympicMap.jsx`

2. **Custom Map Styles**: Replace the demo map style with a custom style or other providers

3. **Advanced Interactions**: Add features like:
   - Clustering for dense venue locations
   - Search and filtering
   - Layer controls for different types of venues
   - Heat maps showing venue density

4. **Performance Optimization**: 
   - Implement data caching
   - Add loading indicators
   - Optimize large datasets

## File Structure

```
src/
├── components/
│   ├── Map.jsx                      # Basic map component
│   ├── MapWithPopups.jsx           # Map with popup functionality
│   └── InteractiveOlympicMap.jsx   # Full-featured interactive map
├── app/
│   ├── map/
│   │   └── page.jsx                # Map page
│   ├── globals.css                 # Global styles (includes MapLibre CSS)
│   └── page.jsx                    # Home page
└── ...

public/
└── data/
    └── 1928_Amsterdam.geojson      # Sample Olympic venue data
```
