import {olympicColors} from "@/components/utility";

/**
 * Get the range of years from the data
 * @param data
 * @returns {{min: number, max: number}|{min: string, max: string}}
 */
export const getYearRange = (data) => {
    if (!data?.games) return {min: 'auto', max: 'auto'};

    const years = data.games.map(game => game.year);
    return {
        min: Math.min(...years),
        max: Math.max(...years)
    };
};

/**
 * Get line color for a metric based on its index in the visible metrics list
 *
 * @param ID - index of the metric in the visible metrics list
 * @param visibleColors - total number of visible metrics
 * @param alpha - optional alpha value for transparency (0 to 1)
 * @returns {string} - HSLA color string
 */
export const getColorFromPalet = (ID, visibleColors, alpha = 1) => {
    const baseHue = ID * 360 / visibleColors;

    // Same color for both summer and winter lines of the same metric
    // return `hsl(${baseHue}, 70%, 50%)`;
    // return `hsl(${baseHue}, 70%, 35%)`;
    return `hsla(${baseHue}, 70%, 50%, ${alpha})`;
    // return graphColors[baseIndex % graphColors.length]
};


/**
 * Get point color based on the season
 *
 * @param season - 'Summer' or 'Winter'
 * @returns {string} - Hex color code
 */
export const getSeasonColor = (season) => {
    if (!season || typeof season !== 'string') {
        return olympicColors.extended.black3 // Gray fallback color
    }

    switch (season.toLowerCase()) {
        case 'summer':
            return olympicColors.primary.yellow;
        case 'winter':
            return olympicColors.primary.blue;
        default:
            return olympicColors.extended.black4; // Gray fallback color
    }
};

export const graphTheme = {
    background: 'transparent',
    grid: {
        line: {
            stroke: '#374151',
            strokeWidth: 1
        }
    },
    text: {
        fill: '#374151',
        fontSize: 11
    },
    axis: {
        ticks: {
            line: {
                stroke: '#374151',
            },
            text: {
                fontSize: 11,
                fill: '#d1d5db',
            }
        },
        legend: {
            text: {
                fontSize: 12,
                fill: '#d1d5db',
            }
        },
        domain: {
            line: {
                stroke: '#374151',
                strokeWidth: 2
            }
        },
    },
    legends: {
        text: {
            fill: '#d1d5db',
            fontSize: 11,
        }
    },
    labels: {
        text: {
            fontSize: 11,
            fill: '#d1d5db',
        }
    }
};
