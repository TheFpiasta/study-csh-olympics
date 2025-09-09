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