import {olympicColors} from "@/components/utility";

/**
 * Get the range of years from the data
 * @param data
 * @returns {{min: number, max: number}|{min: string, max: string}}
 */
export const getYearRange = (data) => {
    if (!data?.games) return { min: 'auto', max: 'auto' };

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
export const getMetricColor = (ID, visibleColors, alpha = 1) => {
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
export const getPointColor = (season) => {
    if (!season || typeof season !== 'string') {
        return olympicColors.extended.black3 // Gray fallback color
    }

    switch (season) {
        case 'Summer' || 'summer':
            return olympicColors.primary.yellow;
        case 'Winter' || 'winter':
            return olympicColors.primary.blue;
        default:
            return olympicColors.extended.black3; // Gray fallback color
    }
};