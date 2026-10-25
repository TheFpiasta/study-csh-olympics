# Olympic Venues Web App - Styling Guide

## 🎨 Design System Overview

This Olympic Venues web application features a comprehensive design system inspired by the Olympic Games, with modern styling, responsive design, and dark mode support.

### 🏅 Olympic Theme Colors

The design system uses the official Olympic ring colors:
- **Olympic Blue**: `#0081C8`
- **Olympic Yellow**: `#FCB131` 
- **Olympic Green**: `#00A651`
- **Olympic Red**: `#EE334E`
- **Olympic Black**: `#000000`

### 🌙 Dark Mode Support

The application includes a fully implemented dark mode with:
- Automatic system preference detection
- Manual toggle with animated icons
- Persistent theme storage in localStorage
- Smooth transitions between themes

### 📱 Responsive Design

#### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

#### Key Responsive Features
- Mobile-first navigation with bottom navigation bar
- Responsive grid layouts for different screen sizes
- Adaptive map container heights
- Touch-friendly button sizes on mobile

### 🔧 Key Components

#### 1. **OlympicRings** (`/src/components/OlympicRings.jsx`)
- Animated Olympic rings with proper colors
- Configurable size and animation
- Used as decorative elements throughout the app

#### 2. **ThemeToggle** (`/src/components/ThemeToggle.jsx`)
- Smooth animated icon transitions
- Accessible with proper ARIA labels and titles
- Glass morphism effect

#### 3. **Navigation** (`/src/components/Navigation.jsx`)
- Responsive design with mobile bottom navigation
- Desktop top navigation for larger screens
- Active state indicators with Olympic colors

#### 4. **LoadingSpinner** (`/src/components/LoadingSpinner.jsx`)
- Olympic-themed loading animation
- Customizable message
- Spinning Olympic rings with pulse effects

#### 5. **Alert** (`/src/components/Alert.jsx`)
- Multiple alert types (info, success, warning, error)
- Dark mode support
- Dismissible functionality

#### 6. **Breadcrumbs** (`/src/components/Breadcrumbs.jsx`)
- Automatic breadcrumb generation based on route
- Icons for different page types
- Responsive design

### 📊 Data Visualization Components

#### Chart Containers

- **Consistent Background Pattern**: All chart containers use `bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm`
- **Rounded Corners**: Standard `rounded-2xl` (16px radius) for modern glass-morphism effect
- **Border Treatment**: Subtle borders with `border-gray-200/50 dark:border-gray-600/50` for depth
- **Shadow Effects**: `shadow-lg` for elevated appearance

#### Interactive Controls & Filters

- **Filter Groups**: Wrapped in `bg-gray-50 dark:bg-gray-800 rounded-lg p-4` containers
- **Toggle Buttons**: Pill-shaped buttons with `rounded-full px-3 py-1 text-xs font-medium`
- **Active States**: Emerald theme (`bg-emerald-500 text-white`) for primary selections
- **Seasonal Colors**: Purple for "Both", Amber for "Summer", Cyan for "Winter"
- **Hover Effects**: `hover:bg-gray-300 dark:hover:bg-gray-600` for inactive states

#### Section Headers

- **Main Titles**: `text-xl font-semibold text-gray-900 dark:text-gray-200`
- **Descriptive Text**: Small gray subtitles with `text-sm font-normal text-gray-600 dark:text-gray-400`
- **Icon Integration**: Emojis used consistently for visual hierarchy (📈, 📊, 💰)

#### Chart Styling Standards

- **Height**: Standard chart containers use `h-96` (384px)
- **Nivo Theme**: Custom dark-compatible theme with `#d1d5db` text color and `font-weight: 600`
- **Grid Lines**: `stroke: '#374151', strokeWidth: 1` for subtle grid appearance
- **Tooltip Styling**: White backgrounds with shadows and rounded corners
- **Legend Spacing**: Consistent gap spacing with `gap-4` for legend items

### 🎭 CSS Features & Patterns

#### Glassmorphism Effects
```css
/* Main container style used throughout data visualization components */
.glass-container {
  background: rgba(255, 255, 255, 0.95); /* white/95 */
  backdrop-filter: blur(4px); /* backdrop-blur-sm */
  border-radius: 16px; /* rounded-2xl */
  border: 1px solid rgba(229, 231, 235, 0.5); /* border-gray-200/50 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* shadow-lg */
}

/* Dark mode variation */
.dark .glass-container {
  background: rgba(31, 41, 55, 0.8); /* dark:bg-gray-800/80 */
  border-color: rgba(75, 85, 99, 0.5); /* dark:border-gray-600/50 */
}
```

#### Olympic Background Pattern
```css
.olympic-bg {
  background-image: 
    radial-gradient(circle at 20% 20%, rgba(0, 129, 200, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(252, 177, 49, 0.1) 0%, transparent 50%),
    /* ... additional gradients for each Olympic color */
}
```

#### Enhanced Button Styling
```css
.btn-olympic {
  /* Modern button with hover effects and shadows */
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

/* Filter button patterns */
.filter-button {
  padding: 4px 12px; /* px-3 py-1 */
  border-radius: 9999px; /* rounded-full */
  font-size: 12px; /* text-xs */
  font-weight: 500; /* font-medium */
  transition: colors 150ms; /* transition-colors */
}

.filter-button.active {
  background-color: #10b981; /* bg-emerald-500 */
  color: white;
}

.filter-button.inactive {
  background-color: #e5e7eb; /* bg-gray-200 */
  color: #374151; /* text-gray-700 */
}

.dark .filter-button.inactive {
  background-color: #374151; /* dark:bg-gray-700 */
  color: #d1d5db; /* dark:text-gray-300 */
}
```

#### Chart-Specific Styling

```css
/* Consistent chart container height */
.chart-container {
  height: 384px; /* h-96 */
}

/* Custom Nivo chart text styling */
.chart-container :global(text) {
  fill: #d1d5db !important; /* Consistent text color */
  font-weight: 600 !important; /* Semi-bold for readability */
}

/* Tooltip styling pattern */
.chart-tooltip {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  min-width: 384px; /* min-w-96 */
  max-width: 448px; /* max-w-md */
}

.dark .chart-tooltip {
  background: #1f2937; /* dark:bg-gray-800 */
  border-color: #4b5563; /* dark:border-gray-600 */
}
```

### 🗺️ Map Styling Enhancements

The interactive map component (`MapWithLayers.jsx`) includes:
- Dark mode compatible popups
- Glass morphism control panels
- Responsive map container
- Enhanced hover effects and animations
- Olympic-themed color scheme for UI elements

### 📊 Future-Ready Components

#### ResponsiveGrid
- Configurable column layouts for different breakpoints
- Easy to use for data visualization layouts

#### Alert System
- Ready for error handling and user notifications
- Multiple types with consistent styling

### 🎨 Usage Examples & Patterns

#### Chart Container Pattern

```jsx
<div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
  {/* Chart content */}
</div>
```

#### Section Header Pattern

```jsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
    📈 Chart Title
    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
      Chart Type
    </span>
  </h3>
</div>
```

#### Filter Group Pattern

```jsx
<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Filter Label
  </label>
  <div className="flex flex-wrap gap-2">
    <button className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
      isActive ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }`}>
      Filter Option
    </button>
  </div>
</div>
```

#### Toggle Button Group Pattern

```jsx
<div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
  <button className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
    isSelected ? 'bg-emerald-500 text-white' : 'text-gray-600 dark:text-gray-300'
  }`}>
    Option
  </button>
</div>
```

#### Legend Pattern

```jsx
<div className="flex flex-col items-center mt-4 gap-4">
  <div className="flex flex-col items-center gap-2">
    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
      Legend Title
    </span>
    <div className="flex flex-wrap justify-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-4 h-0.5" style={{backgroundColor: '#color'}}></div>
        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
          Legend Item
        </span>
      </div>
    </div>
  </div>
</div>
```

#### Basic Olympic Button
```jsx
<button className="btn-olympic bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
  Interactive Map
</button>
```

#### Olympic Background
```jsx
<div className="olympic-bg min-h-screen">
  Content with Olympic-themed background
</div>
```

### 🎨 Color System & Semantic Usage

#### Chart & Data Visualization Colors
```css
:root {
  /* Olympic Colors */
  --olympic-blue: #0081C8;
  --olympic-yellow: #FCB131;
  --olympic-green: #00A651;
  --olympic-red: #EE334E;
  --olympic-black: #000000;
  
  /* Semantic Chart Colors */
  --chart-cost: #dc2626;     /* Red for costs */
  --chart-revenue: #16a34a;  /* Green for revenue */
  --chart-profit: #2563eb;   /* Blue for profit */
  
  /* Season Colors */
  --summer-color: #f59e0b;   /* Amber for Summer Olympics */
  --winter-color: #06b6d4;   /* Cyan for Winter Olympics */
  --both-color: #8b5cf6;     /* Purple for "Both" selection */
}
```

#### Filter State Colors

- **Active State**: `bg-emerald-500 text-white` for primary selections
- **Summer Filter**: `bg-amber-500 text-white` when selected
- **Winter Filter**: `bg-cyan-500 text-white` when selected
- **Both Filter**: `bg-purple-500 text-white` when selected
- **Inactive State**: `bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300`

#### Consistent Spacing Scale

- **Container Padding**: `p-6` (24px) for main containers
- **Filter Padding**: `p-4` (16px) for filter groups
- **Button Padding**: `px-3 py-1` (12px horizontal, 4px vertical)
- **Gap Spacing**: `gap-2` (8px), `gap-4` (16px), `gap-6` (24px)
- **Margin Bottom**: `mb-4` (16px) for sections

### 🔧 Customization Guidelines

The design system uses Tailwind CSS classes with consistent patterns:

```css
/* Component-specific customization */
.chart-theme {
  --grid-color: #374151;
  --text-color: #d1d5db;
  --tooltip-bg: #ffffff;
  --tooltip-border: #e5e7eb;
}

.dark .chart-theme {
  --tooltip-bg: #1f2937;
  --tooltip-border: #4b5563;
}
```

### 📱 Mobile Optimizations

- Touch-friendly navigation
- Reduced animation complexity on mobile
- Optimized glassmorphism effects for performance
- Responsive typography scaling

### ♿ Accessibility Features

- High contrast ratios in both light and dark modes
- Keyboard navigation support
- Screen reader friendly labels
- Focus indicators
- Reduced motion support

### 🎯 Performance Considerations

- Optimized animations with CSS transforms
- Efficient backdrop-filter usage
- Lazy loading for heavy components
- Minimal bundle size with tree shaking

This design system provides a solid foundation for the Olympic Venues web application while maintaining flexibility for future enhancements and features.
