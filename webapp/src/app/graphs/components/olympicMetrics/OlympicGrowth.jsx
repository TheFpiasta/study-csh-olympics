import {ResponsiveLine} from "@nivo/line";
import {useState, useEffect} from "react";
import {getColorFromPalet, getSeasonColor} from "@/app/graphs/components/utility";
import {olympicColors} from "@/components/utility";

export default function OlympicGrowth({data}) {
  const [seasonFilter, setSeasonFilter] = useState('both');

  // Process data for Olympic Growth Timeline with season filtering
  const getGrowthTimelineData = () => {
    if (!data?.games) return [];

    const metrics = [
      {key: 'venues', name: 'Venues'},
      {key: 'sports', name: 'Sports'}
    ];

    let processedData;

    if (seasonFilter === 'both') {
      // Create separate series for summer and winter for each metric
      processedData = metrics.flatMap(metric => {
        const seasons = ['summer', 'winter'];
        return seasons.map(season => {
          const seasonData = data.games
            .filter(game => {
              const gameSeason = game.features && game.features.length > 0 ?
                game.features[0].properties.season : null;
              return gameSeason && gameSeason.toLowerCase() === season.toLowerCase();
            })
            .map(game => {
              let value;
              if (metric.key === 'venues') {
                value = game.venueCount;
              } else if (metric.key === 'sports') {
                const uniqueSports = new Set();
                game.features.forEach(feature => {
                  if (feature.properties.sports && Array.isArray(feature.properties.sports)) {
                    feature.properties.sports.forEach(sport => uniqueSports.add(sport));
                  }
                });
                value = uniqueSports.size;
              }

              const gameSeason = game.features && game.features.length > 0 ?
                game.features[0].properties.season : 'Unknown';

              return {
                x: game.year,
                y: value,
                location: game.location,
                season: gameSeason,
                metric: metric.name
              };
            })
            .sort((a, b) => a.x - b.x);

          return {
            id: `${metric.name} (${season.charAt(0).toUpperCase() + season.slice(1)})`,
            data: seasonData,
            baseName: metric.name,
            season: season
          };
        }).filter(series => series.data.length > 0);
      });
    } else if (seasonFilter === 'combined') {
      // Create combined series that sum summer and winter data for each year
      processedData = metrics.map(metric => {
        const yearDataMap = new Map();

        data.games
          .filter(game => {
            const gameSeason = game.features && game.features.length > 0 ?
              game.features[0].properties.season : null;
            return gameSeason && (gameSeason.toLowerCase() === 'summer' || gameSeason.toLowerCase() === 'winter');
          })
          .forEach(game => {
            const year = parseInt(game.year);
            if (isNaN(year)) return;

            let value;
            if (metric.key === 'venues') {
              value = game.venueCount;
            } else if (metric.key === 'sports') {
              const uniqueSports = new Set();
              game.features.forEach(feature => {
                if (feature.properties.sports && Array.isArray(feature.properties.sports)) {
                  feature.properties.sports.forEach(sport => uniqueSports.add(sport));
                }
              });
              value = uniqueSports.size;
            }

            const gameSeason = game.features[0].properties.season;

            if (!yearDataMap.has(year)) {
              yearDataMap.set(year, {
                year,
                totalValue: 0,
                locations: [],
                seasons: []
              });
            }

            const yearData = yearDataMap.get(year);
            yearData.totalValue += value;
            yearData.locations.push(game.location);
            yearData.seasons.push(gameSeason);
          });

        const seriesData = Array.from(yearDataMap.values()).map(yearData => ({
          x: yearData.year,
          y: yearData.totalValue,
          location: yearData.locations.join(' & '),
          season: 'Summer & Winter',
          metric: metric.name
        })).sort((a, b) => a.x - b.x);

        return {
          id: metric.name,
          data: seriesData,
          baseName: metric.name,
          season: 'combined'
        };
      }).filter(series => series.data.length > 0);
    } else {
      // Single season logic
      processedData = metrics.map(metric => ({
        id: metric.name,
        data: data.games
          .filter(game => {
            const gameSeason = game.features && game.features.length > 0 ?
              game.features[0].properties.season : null;
            return gameSeason && gameSeason.toLowerCase() === seasonFilter.toLowerCase();
          })
          .map(game => {
            let value;
            if (metric.key === 'venues') {
              value = game.venueCount;
            } else if (metric.key === 'sports') {
              const uniqueSports = new Set();
              game.features.forEach(feature => {
                if (feature.properties.sports && Array.isArray(feature.properties.sports)) {
                  feature.properties.sports.forEach(sport => uniqueSports.add(sport));
                }
              });
              value = uniqueSports.size;
            }

            const gameSeason = game.features && game.features.length > 0 ?
              game.features[0].properties.season : 'Unknown';

            return {
              x: game.year,
              y: value,
              location: game.location,
              season: gameSeason,
              metric: metric.name
            };
          })
          .sort((a, b) => a.x - b.x),
        baseName: metric.name,
        season: seasonFilter
      })).filter(series => series.data.length > 0);
    }

    return processedData;
  };

  const growthData = getGrowthTimelineData();

  return (
    <div
      className="bg-white/95 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/50 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-200 flex items-center gap-2">
        📈 Olympic Growth Timeline
        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                        Venues & Sports Over Time
                    </span>
      </h3>

      {/* Olympic Season Filter */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Olympic Season
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSeasonFilter('both')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              seasonFilter === 'both'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Both
          </button>
          <button
            onClick={() => setSeasonFilter('summer')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              seasonFilter === 'summer'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Summer
          </button>
          <button
            onClick={() => setSeasonFilter('winter')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              seasonFilter === 'winter'
                ? 'bg-cyan-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Winter
          </button>
          <button
            onClick={() => setSeasonFilter('combined')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              seasonFilter === 'combined'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Combined
          </button>
        </div>
      </div>
      <div className="h-80 chart-container">
        <style jsx>{`
          .chart-container :global(text) {
            fill: #d1d5db !important;
            font-weight: 600 !important;
          }
        `}</style>
        <ResponsiveLine
          data={growthData}
          margin={{top: 20, right: 30, bottom: 50, left: 60}}
          xScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto'
          }}
          colors={(serie) => {
            const metrics = ['Venues', 'Sports'];
            let baseName = serie.id;
            if (serie.id.includes(' (Summer)') || serie.id.includes(' (Winter)')) {
              baseName = serie.id.replace(' (Summer)', '').replace(' (Winter)', '');
            }
            const baseIndex = metrics.indexOf(baseName);
            return getColorFromPalet(baseIndex, metrics.length);
          }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto'
          }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Year',
            legendOffset: 36,
            legendPosition: 'middle'
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Count',
            legendOffset: -50,
            legendPosition: 'middle'
          }}
          pointSize={10}
          pointColor={(point) => {
            if (seasonFilter === 'both') {
              const seriesId = point.point?.seriesId || point.serie?.id || point.serieId || '';
              if (seriesId.includes(' (Summer)')) {
                return getSeasonColor('Summer');
              } else if (seriesId.includes(' (Winter)')) {
                return getSeasonColor('Winter');
              }
            } else if (seasonFilter === 'combined') {
              return '#10b981';
            } else {
              const season = seasonFilter === 'summer' ? 'Summer' : 'Winter';
              return getSeasonColor(season);
            }
            return getSeasonColor('Unknown');
          }}
          pointBorderWidth={1}
          pointBorderColor={olympicColors.extended.black6}
          enableGridX={true}
          enableGridY={true}
          useMesh={true}
          tooltip={({point}) => (
            <div
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 min-w-96 max-w-md">
              <div className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                {point.data.location} {point.data.x}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {point.data.season} Olympics
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Metric:</span>
                  <span className="text-gray-900 dark:text-gray-100">{point.data.metric}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Count:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold">
                    {point.data.y}
                  </span>
                </div>
              </div>
            </div>
          )}
          theme={{
            background: 'transparent',
            grid: {
              line: {
                stroke: '#374151',
                strokeWidth: 1
              }
            },
            tooltip: {
              container: {
                background: '#ffffff',
                color: '#374151',
                fontSize: '12px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                padding: '8px 12px'
              }
            },
            axis: {
              ticks: {
                text: {
                  fontSize: 11,
                  fill: '#d1d5db',
                  fontWeight: 600
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
      </div>

      {/* Custom Legend */}
      <div className="flex flex-col items-center mt-4 gap-4">
        {/* Metrics Legend (Line Colors) */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
            Olympic Metrics
          </span>
          <div className="flex flex-wrap justify-center gap-4">
            {['Venues', 'Sports'].map((metric, index) => (
              <div key={metric} className="flex items-center gap-2">
                <div
                  className="w-4 h-0.5"
                  style={{backgroundColor: getColorFromPalet(index, 2)}}
                ></div>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {metric}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Season Legend (Point Colors) - Show when "both" or "combined" is selected */}
        {(seasonFilter === 'both' || seasonFilter === 'combined') && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              Olympic Seasons
            </span>
            <div className="flex flex-wrap justify-center gap-4">
              {seasonFilter === 'both' ? (
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{backgroundColor: getSeasonColor('Summer')}}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Summer
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{backgroundColor: getSeasonColor('Winter')}}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                      Winter
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{backgroundColor: '#10b981'}}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Summer & Winter Combined
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
