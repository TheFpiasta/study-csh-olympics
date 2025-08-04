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

### 🎭 CSS Features

#### Glassmorphism Effects
```css
.glass {
  backdrop-filter: blur(16px) saturate(180%);
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.125);
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

### 🎨 Usage Examples

#### Basic Olympic Button
```jsx
<button className="btn-olympic bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
  Interactive Map
</button>
```

#### Glass Panel
```jsx
<div className="glass rounded-2xl p-6">
  Content with glassmorphism effect
</div>
```

#### Olympic Background
```jsx
<div className="olympic-bg min-h-screen">
  Content with Olympic-themed background
</div>
```

### 🔧 Customization

The design system is built with CSS custom properties, making it easy to customize:

```css
:root {
  --olympic-blue: #0081C8;
  --olympic-yellow: #FCB131;
  /* ... other variables */
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
