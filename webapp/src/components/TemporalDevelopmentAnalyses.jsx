'use client';

import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

const TemporalDevelopmentAnalyses = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/olympics/all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch Olympic data: ${response.status} ${errorText}`);
        }
        
        const olympicData = await response.json();
        setData(olympicData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-800 dark:text-red-300">Error loading data: {error}</p>
      </div>
    );
  }

  if (!data || !data.games || data.games.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <p className="text-yellow-800 dark:text-yellow-300">No Olympic data available</p>
      </div>
    );
  }

  return (
      <div className="space-y-8">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-600/20 dark:to-orange-600/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                      ⏳ Temporal development analyses
                      <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                          Infrastructure Evolution Over Time
                      </span>
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Analysis of Olympic venue development patterns over time, infrastructure evolution, and historical trends
                  </p>
              </div>
          </div>

          {/* Number of venues per Olympic Games */}
          <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  📊 Number of venues per Olympic Games
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Line or Bar Chart
                  </span>
              </h3>
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">Chart implementation pending</p>
              </div>
          </div>

          {/* Ratio of new buildings to existing facilities over time */}
          <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  🏗️ Ratio of new buildings to existing facilities over time
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Area Chart
                  </span>
              </h3>
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">Chart implementation pending</p>
              </div>
          </div>

          {/* Reuse status of Olympic venues over time */}
          <div className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
                  🔄 Reuse status of Olympic venues over time
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                      Sankey Diagram
                  </span>
              </h3>
              <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">Chart implementation pending</p>
              </div>
          </div>

      </div>
  );
};

export default TemporalDevelopmentAnalyses;