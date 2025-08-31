'use client';

import { useEffect, useRef, useState } from 'react';

export default function GlobeView({ venues = [] }) {
  const globeEl = useRef();
  const globeInstance = useRef();
  const [Globe, setGlobe] = useState(null);

  // Dynamically import globe.gl only on client side
  useEffect(() => {
    import('globe.gl').then((GlobeGL) => {
      setGlobe(() => GlobeGL.default);
    });
  }, []);

  useEffect(() => {
    if (!globeEl.current || !Globe) return;

    // Initialize Globe.gl
    const globe = Globe()
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .backgroundColor('rgba(0,0,0,0)')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .width(globeEl.current.clientWidth)
      .height(globeEl.current.clientHeight);

    globeInstance.current = globe;
    globe(globeEl.current);

    return () => {
      if (globeInstance.current) {
        globeInstance.current._destructor?.();
      }
    };
  }, [Globe]);

  useEffect(() => {
    if (globeInstance.current && venues.length > 0) {
      // Convert venues to globe.gl format for filled circles (using htmlElementsData)
      const htmlData = venues.map((venue, index) => ({
        lat: venue.geometry?.coordinates[1] || venue.latitude,
        lng: venue.geometry?.coordinates[0] || venue.longitude,
        color: getVenueColor(venue.properties?.status),
        venue: venue
      }));

      globeInstance.current
        .htmlElementsData(htmlData)
        .htmlElement(d => {
          const el = document.createElement('div');
          el.style.color = d.color;
          el.style.width = '10px';
          el.style.height = '10px';
          el.style.backgroundColor = d.color;
          el.style.borderRadius = '50%';
          el.style.border = '1px solid rgba(255,255,255,0.8)';
          el.style.pointerEvents = 'auto';
          el.style.cursor = 'pointer';
          return el;
        });
    }
  }, [venues, Globe]);

  // Match the 2D map venue colors
  const getVenueColor = (status) => {
    if (!status) return '#94a3b8';
    
    if (status.includes('In use')) {
      if (status.includes('rebuilt')) return '#10b981';
      if (status.includes('repurposed')) return '#06b6d4';
      if (status.includes('seasonal')) return '#3b82f6';
      if (status.includes('limited')) return '#8b5cf6';
      return '#22c55e';
    }
    
    if (status.includes('Not in use')) {
      if (status.includes('demolished')) return '#dc2626';
      return '#ef4444';
    }
    
    if (status.includes('Dismantled')) {
      if (status.includes('temporary')) return '#991b1b';
      if (status.includes('seasonal')) return '#7c2d12';
      return '#991b1b';
    }
    
    return '#94a3b8';
  };

  return (
    <div 
      ref={globeEl} 
      className="w-full h-full"
      style={{ background: 'transparent' }}
    >
      {!Globe && (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-600 dark:text-gray-400">Loading Globe...</div>
        </div>
      )}
    </div>
  );
}
