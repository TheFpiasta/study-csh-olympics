'use client';

import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';

const ChartsPanel = ({ geojsonData, getStatusBreakdown, timelineData }) => {
  // Prepare timeline status data for line chart
  const getTimelineStatusData = () => {
    if (!timelineData || !timelineData.timelineMode || !timelineData.filteredGames || !timelineData.geojsonData) {
      return [];
    }

    // Get color mapping from the same source as bar chart
    const statusBreakdown = getStatusBreakdown();
    const statusColors = {};
    statusBreakdown.forEach(item => {
      statusColors[item.status] = item.color;
    });

    // Get all unique status types
    const allStatuses = new Set();
    timelineData.geojsonData.features.forEach(feature => {
      const status = feature.properties.status || 'No status data';
      allStatuses.add(status);
    });

    const lineData = Array.from(allStatuses).map(status => {
      const data = timelineData.filteredGames.map(game => {
        // Count venues with this status for this game
        // olympics_game property contains the game name, not id
        const gameVenues = timelineData.geojsonData.features.filter(feature => 
          feature.properties.olympics_game === game.name
        );
        const statusCount = gameVenues.filter(venue => 
          (venue.properties.status || 'No status data') === status
        ).length;

        return {
          x: game.year,
          y: statusCount
        };
      }); // Don't filter out 0 values to maintain consistent x-axis

      return {
        id: status,
        color: statusColors[status] || '#94a3b8',
        data: data
      };
    }).filter(series => 
      series.data.some(point => point.y > 0) // Only include series that have at least one non-zero value
    );

    return lineData;
  };
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
  const timelineStatusData = getTimelineStatusData();
  
  // Show timeline chart if we're in timeline mode with multiple games
  const showTimelineChart = timelineData && 
                            timelineData.timelineMode && 
                            timelineData.filteredGames && 
                            timelineData.filteredGames.length > 1;

  return (
    <div className="h-full flex flex-col">
      {/* Venue Status Chart */}
      <div className={`${showTimelineChart ? 'mb-4' : 'mb-6'}`}>
        <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Venue Status Distribution
        </h4>
        <div className={`${showTimelineChart ? 'h-52' : 'h-80'} bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 chart-container`}>
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
            margin={{ top: 10, right: 10, bottom: 80, left: 50 }}
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

      {/* Timeline Status Development Chart */}
      {showTimelineChart && (
        <div className="mb-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Venue Status Development Over Time
          </h4>
          <div className="h-52 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 chart-container">
            <style jsx>{`
              .chart-container :global(text) {
                fill: #d1d5db !important;
                font-weight: 600 !important;
              }
            `}</style>
            {timelineStatusData.length > 0 ? (
              <ResponsiveLine
                data={timelineStatusData}
                margin={{ top: 10, right: 110, bottom: 50, left: 50 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                  stacked: false,
                  reverse: false
                }}
                yFormat=" >-.2f"
                colors={({ color }) => color}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0
                }}
                pointSize={6}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1
                        }
                      }
                    ]
                  }
                ]}
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
                        fill: '#d1d5db'
                      }
                    },
                    legend: {
                      text: {
                        fontSize: 12,
                        fill: '#d1d5db',
                        fontWeight: 600
                      }
                    }
                  },
                  legends: {
                    text: {
                      fontSize: 11,
                      fill: '#d1d5db',
                      fontWeight: 600
                    }
                  }
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No timeline data available for the selected games
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder for more charts - only show if no timeline chart */}
      {!showTimelineChart && (
        <div className="flex-1 flex items-center justify-center">
          <div className="p-6 text-center border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              More charts coming soon...
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Select multiple games in timeline mode to see development charts
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartsPanel;
