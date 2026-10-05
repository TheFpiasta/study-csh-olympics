# Olympic Venues Web Application

A sophisticated Next.js web application for visualizing and analyzing Olympic venue data through interactive maps and comprehensive data visualizations. Part of a thesis project for Computational Spatial Humanities at University Leipzig.

## 🌟 Features

### Interactive Map Visualization
- **MapLibre GL** integration with multiple layer support
- **Interactive venue markers** with detailed popup information
- **Multiple map styles**: Countries view, Streets & Cities, Light/Dark themes
- **Timeline controls** for temporal data exploration
- **Responsive design** optimized for desktop and mobile devices

### Data Analytics Dashboard
- **Temporal Analysis** - Venue development over time
- **Geographic Analysis** - Spatial distribution patterns
- **Status Breakdown** - Current venue usage statistics
- **Interactive Charts** using Nivo library (@nivo/*)

### Modern UI/UX
- **Dark mode support** with smooth theme transitions
- **Olympic-themed design** with custom color palette
- **Glassmorphism effects** and smooth animations
- **Responsive grid layouts** for all screen sizes

## 🛠 Technology Stack

### Core Framework
- **Next.js 16.3.8** - React framework with App Router
- **React 19.3.0** - Latest React with modern features
- **Node.js** - Server-side JavaScript runtime

### Styling & UI
- **Tailwind CSS 4.3.3** - Utility-first CSS framework
- **PostCSS** - CSS processing with Lightning CSS
- **Custom Olympic theme** with brand colors
- **Geist fonts** - Modern typography from Vercel

### Mapping & Visualization
- **MapLibre GL 6.12.0** - Open-source mapping library
- **React Map GL 8.1.3** - React bindings for MapLibre
- **Nivo Charts** - Complete data visualization library
  - Bar charts, Line charts, Pie charts, Heatmaps
  - Network graphs, Sankey diagrams, Scatterplots

### State Management & Theming
- **Next Themes 0.4.6** - Advanced theme management
- **React Context** - Global state for data and UI
- **Session Storage** - Persistent user preferences

## 📁 Project Structure

```
webapp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── olympics/      # Olympic data endpoints
│   │   │       ├── all/       # All Olympics data
│   │   │       └── [slug]/    # Individual Olympics data
│   │   ├── map/               # Interactive map page
│   │   ├── graphs/            # Data analytics page
│   │   ├── layout.jsx         # Root layout with themes
│   │   ├── page.jsx           # Home page
│   │   └── globals.css        # Global styles & animations
│   ├── components/            # Reusable React components
│   │   ├── InteractiveOlympicMap.jsx    # Single dataset map
│   │   ├── MapWithChartsLayout.jsx      # Main map + charts layout
│   │   ├── MapWithLayers.jsx            # Multi-layer map with controls
│   │   ├── ChartsPanel.jsx              # Analytics dashboard
│   │   ├── DatasetStatistics.jsx         # Time-series visualizations
│   │   ├── WorldGeographicAnalysis.jsx       # Geographic charts
│   │   ├── InteractiveFeatures.jsx      # Interactive analytics
│   │   ├── ThemeProvider.jsx            # Theme context wrapper
│   │   ├── ThemeToggle.jsx              # Dark/light mode toggle
│   │   ├── OlympicRings.jsx             # Olympic rings SVG component
│   │   ├── LoadingSpinner.jsx           # Loading states
│   │   ├── Navigation.jsx               # Site navigation
│   │   ├── Breadcrumbs.jsx              # Navigation breadcrumbs
│   │   ├── Alert.jsx                    # Alert notifications
│   │   └── ResponsiveGrid.jsx           # Grid layout component
│   └── contexts/
│       └── ThemeContext.jsx    # Theme state management
├── public/
│   ├── data/                  # Sample GeoJSON data
│   └── *.svg                  # Static assets and icons
├── package.json               # Dependencies and scripts
├── next.config.mjs            # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.mjs         # PostCSS configuration
└── jsconfig.json              # JavaScript path mapping
```

## 🚀 Getting Started

### Prerequisites
- **Node.js 24** with yarn
- Access to Olympic venue data (GeoJSON files in parent directory)

### Installation

```bash
# Navigate to webapp directory
cd webapp

# Install dependencies
yarn install
```

### Development

```bash
# Start development server
yarn dev

# The application will be available at http://localhost:3000
```

### Production

```bash
# Build for production
yarn build

# Start production server
yarn start

# Or build and start together
yarn prod
```

## 📊 Data Integration

### API Endpoints

#### `/api/olympics/all`
Returns comprehensive data for all Olympic games:
```json
{
  "games": [
    {
      "year": 2012,
      "season": "Summer",
      "location": "London",
      "filename": "combined_2012_London.geojson",
      "venueCount": 34,
      "features": [...]
    }
  ],
  "totalGames": 25,
  "totalVenues": 847
}
```

#### `/api/olympics/[slug]`
Returns GeoJSON data for specific Olympic games:
- Format: `/api/olympics/2012_London`
- Returns: Complete GeoJSON FeatureCollection

### Data Sources
- **Primary Source**: `../geojson_scraper/combined_geojson/` directory
- **Format**: GeoJSON files with Olympic venue features
- **Naming Convention**: `combined_YYYY_Location.geojson`

### Venue Data Schema
Each venue feature includes:
- **Location**: Coordinates and place information
- **Sports**: Array of sports held at the venue
- **Status**: Current usage status (In use, Demolished, etc.)
- **Type**: Venue category (Stadium, Arena, etc.)
- **Associated Names**: Historical and current venue names
- **Venue Information**: Detailed descriptions and metadata

## 🎨 Styling & Design

### Olympic Color Palette
```css
--olympic-blue: #0081C8;     /* Primary blue */
--olympic-yellow: #FCB131;   /* Olympic yellow */
--olympic-black: #000000;    /* Olympic black */
--olympic-green: #00A651;    /* Olympic green */
--olympic-red: #EE334E;      /* Olympic red */
```

### Theme Support
- **Dark Mode**: Default theme with slate-900 backgrounds
- **Light Mode**: Available via theme toggle
- **System Theme**: Automatic based on user preference
- **Smooth Transitions**: 300ms cubic-bezier animations

### Custom CSS Classes
- `.olympic-bg` - Olympic-themed gradient backgrounds
- `.glass` - Glassmorphism effects for panels
- `.btn-olympic` - Styled action buttons with hover effects
- `.venue-popup` - Custom map popup styling

## 🗺️ Map Features

### Available Map Layers
1. **Countries View** - Clean boundaries (MapLibre demo tiles)
2. **Streets & Cities** - OpenStreetMap tiles
3. **Light Theme** - Carto Positron tiles
4. **Dark Theme** - Carto dark tiles

### Interactive Controls
- **Navigation** - Zoom, pan, rotate controls
- **Scale Control** - Distance measurement
- **Geolocate** - User location finder
- **Layer Switcher** - Map style selection
- **Olympics Selector** - Dataset switching
- **Timeline Controls** - Temporal filtering

### Venue Popup Information
- Venue name and associated names
- Location and geographic details
- Sports held at the venue
- Venue type and usage status
- Historical information and metadata

## 📈 Analytics Features

### Temporal Analysis
- **Games Timeline** - Olympic games over time
- **Venue Development** - Growth in venue numbers
- **Seasonal Patterns** - Summer vs Winter games
- **Historical Trends** - Long-term venue usage

### Geographic Analysis
- **Continent Distribution** - Geographic spread
- **Country Analysis** - Host nation patterns
- **City Hosting** - Multiple Olympics hosting
- **Venue Density** - Spatial clustering

### Interactive Features
- **Status Breakdown** - Current venue conditions
- **Sport Distribution** - Venue specializations
- **Capacity Analysis** - Venue size patterns
- **Usage Patterns** - Historical venue utilization

## 🎯 Component Architecture

### Core Components

#### `MapWithChartsLayout`
Main layout component that manages the map-charts interface split view.

#### `MapWithLayers`
Advanced map component with:
- Multiple data layer support
- Timeline filtering capabilities
- Interactive controls and panels
- Session storage for user preferences

#### `InteractiveOlympicMap`
Simplified map component for single dataset visualization.

#### Chart Components

- `DatasetStatistics` - Time-series visualizations
- `WorldGeographicAnalysis` - Spatial data charts
- `ChartsPanel` - Status and metrics dashboard
- `InteractiveFeatures` - Interactive analytics

#### UI Components
- `ThemeProvider` - Dark/light mode management
- `OlympicRings` - Animated Olympic rings SVG
- `LoadingSpinner` - Loading state indicators
- `Navigation` - Site navigation component

## 🔧 Configuration

### Environment Setup
```json
// jsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind Configuration
- **Olympic color palette** integration
- **Dark mode** class-based strategy
- **Custom animations** (float, shimmer)
- **Extended spacing** and typography
- **Responsive breakpoints** optimization

### Next.js Configuration
- **App Router** architecture
- **Font optimization** with Geist fonts
- **Image optimization** for assets
- **API routes** for data fetching

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px - Optimized touch controls
- **Tablet**: 768px - 1024px - Adapted layouts
- **Desktop**: > 1024px - Full feature set

### Mobile Optimizations
- Reduced map container heights
- Touch-friendly button sizing
- Simplified navigation patterns
- Performance-optimized blur effects

## 🔄 State Management

### Global State
- **Theme Context** - Dark/light mode preferences
- **Map View State** - Camera position and zoom
- **Selected Olympics** - Current dataset choice
- **Panel Visibility** - UI component states

### Persistence
- **Session Storage** - User preferences
- **Local Storage** - Theme settings
- **URL State** - Shareable map states

## 🚀 Performance Optimizations

### Data Loading
- **API caching** with appropriate headers
- **Lazy loading** for large datasets
- **Error boundaries** for robust error handling
- **Loading states** for better UX

### Rendering
- **React 19** concurrent features
- **Memoized callbacks** for performance
- **Optimized re-renders** with proper dependencies
- **Efficient list rendering** for large datasets

## 🧪 Development Workflow

### Available Scripts
```bash
yarn dev      # Development server (localhost:3000)
yarn build    # Production build
yarn start    # Production server
yarn prod     # Build + start combined
```

### Development Guidelines
1. **Component Structure** - Follow existing patterns
2. **Styling** - Use Tailwind utility classes
3. **State Management** - Minimize global state
4. **Performance** - Implement loading states
5. **Accessibility** - Follow WCAG guidelines

## 🌐 Deployment

### Production Build
```bash
yarn build
yarn start
```

### Environment Variables
No environment variables required - uses local filesystem for data access.

### Deployment Platforms
- **Vercel** - Recommended for Next.js apps
- **Netlify** - Static site deployment
- **Docker** - Containerized deployment
- **Self-hosted** - Traditional server deployment

## 🤝 Integration Points

### Data Pipeline
1. **PDF Reports** → N8N automation → **JSON extraction**
2. **Web Scraper** → `geojson_scraper/` → **Venue data collection and matching**
3. **API Routes** → File system access → **Frontend consumption**

### External Dependencies
- **Parent Directory Data** - Requires `../geojson_scraper/combined_geojson/`
- **Olympic Venue Data** - GeoJSON format with specific schema
- **Map Tile Services** - External tile providers (OSM, Carto, MapLibre)

## 🔍 Troubleshooting

### Common Issues

#### Data Not Loading
- Verify `../geojson_scraper/combined_geojson/` directory exists
- Check API route paths in `/api/olympics/all/route.js`
- Ensure GeoJSON files follow naming convention

#### Map Not Rendering
- Check MapLibre GL CSS import in `globals.css`
- Verify map style URLs are accessible
- Check browser console for WebGL errors

#### Theme Issues
- Verify Tailwind CSS configuration
- Check theme provider setup in layout
- Ensure dark mode classes are properly applied

### Performance Issues
- Use browser DevTools to profile component renders
- Check for memory leaks in map components
- Optimize large dataset loading with pagination

## 📚 Additional Documentation

- `MAPLIBRE_INTEGRATION.md` - MapLibre GL integration details
- `STYLING_GUIDE.md` - Comprehensive styling guidelines
- `../CLAUDE.md` - Project overview and architecture

## 🎯 Future Development

### Planned Features
- **Outlier detection** and analysis
- **Sustainability scoring** system
- **Comparative studies** between Olympics
- **Sport-specific analytics**
- **Export capabilities** for data and visualizations
- **Advanced filtering** systems

### Technical Debt
- Consolidate map components architecture
- Improve error handling and user feedback
- Add comprehensive test coverage
- Optimize bundle size and performance

## 📝 License

Part of University Leipzig thesis project for Computational Spatial Humanities.

---

**Project Repository**: https://github.com/TheFpiasta/study-csh-olympics

For more information about the complete data pipeline and project architecture, see the main project documentation in the parent directory.
