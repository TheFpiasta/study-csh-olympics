'use client';

import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

const ChartsPanel = ({ geojsonData, getStatusBreakdown }) => {
  if (!geojsonData) {
    return (
      <div className="h-full flex flex-col justify-center items-center text-center p-8">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <path d="m7 11 4-4 4 4-2 3h-4l-2-3z"></path>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
          No Data Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Load Olympic venue data to view analytics
        </p>
      </div>
    );
  }

  const statusData = getStatusBreakdown();

  return (
    <div className="h-full flex flex-col">
      {/* Venue Status Chart */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Venue Status Distribution
        </h4>
        <div className="h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 chart-container">
          <style jsx>{`
            .chart-container :global(text) {
              fill: #d1d5db !important;
              font-weight: 600 !important;
            }
          `}</style>
          <ResponsiveBar
            data={statusData}
            keys={['count']}
            indexBy="status"
            margin={{ top: 20, right: 20, bottom: 100, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={({ data }) => data.color}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 1.6]]
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              truncateTickAt: 15
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#d1d5db"
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            theme={{
              background: 'transparent',
              tooltip: {
                container: {
                  background: '#ffffff',
                  color: '#374151',
                  fontSize: '12px',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e5e7eb',
                  padding: '8px 12px'
                }
              },
              axis: {
                ticks: {
                  text: {
                    fontSize: 11,
                    fill: '#374151'
                  }
                },
                legend: {
                  text: {
                    fontSize: 12,
                    fill: '#374151',
                    fontWeight: 600
                  }
                }
              },
              labels: {
                text: {
                  fontSize: 11,
                  fill: '#f3f4f6',
                  fontWeight: 600,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Placeholder for more charts */}
      <div className="flex-1 flex items-center justify-center">
        <div className="p-6 text-center border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            More charts coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChartsPanel;
