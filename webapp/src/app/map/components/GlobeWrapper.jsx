'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Create a wrapper component that properly handles globe.gl loading
const GlobeWrapper = ({ onGlobeReady, onError }) => {
  const [isClient, setIsClient] = useState(false);
  const [GlobeComponent, setGlobeComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const loadGlobe = async () => {
      try {
        const GlobeGL = await import('globe.gl');
        setGlobeComponent(() => GlobeGL.default);
        if (onGlobeReady) {
          onGlobeReady(GlobeGL.default);
        }
      } catch (err) {
        console.error('Failed to load Globe.gl:', err);
        setError(err);
        if (onError) {
          onError(err);
        }
      }
    };

    loadGlobe();
  }, [isClient, onGlobeReady, onError]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
          <div className="text-gray-600 dark:text-gray-400">Initializing...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="p-6 text-center">
          <div className="mb-4 text-red-500">
            <svg width="48" height="48" className="mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">Globe View Not Available</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            The 3D globe library failed to load: {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!GlobeComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading Globe...</div>
        </div>
      </div>
    );
  }

  return null; // The parent component will handle the globe initialization
};

export default GlobeWrapper;