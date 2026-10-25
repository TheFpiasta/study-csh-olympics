/**
 * Geographic Service - API-powered city/country/continent lookup
 *
 * This service replaces hardcoded geographic mappings by using the cities API
 * to get accurate country and continent information for Olympic host cities.
 */

class GeographicService {
    constructor() {
        this.cache = new Map();
        this.apiEndpoint = '/api/cities';
    }

    /**
     * Get geographic info for a single city
     * @param {string} cityName - Name of the city
     * @returns {Promise<Object>} Geographic information
     */
    async getGeographicInfo(cityName) {
        const cacheKey = cityName.toLowerCase().trim();

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Try API first
            const result = await this.bulkGetGeographicInfo([cityName]);
            return result[cityName] || this.getFallbackInfo(cityName);
        } catch (error) {
            console.warn(`API lookup failed for ${cityName}, using fallback:`, error);
            return this.getFallbackInfo(cityName);
        }
    }

    /**
     * Bulk lookup for multiple cities - more efficient for component initialization
     * @param {string[]} cityNames - Array of city names
     * @returns {Promise<Object>} Map of city names to geographic info
     */
    async bulkGetGeographicInfo(cityNames) {
        if (!cityNames || cityNames.length === 0) {
            return {};
        }

        // Filter out already cached cities
        const uniqueCities = [...new Set(cityNames.map(city => city.trim()))];
        const uncachedCities = uniqueCities.filter(city =>
            !this.cache.has(city.toLowerCase())
        );

        const results = {};

        // Add cached results
        uniqueCities.forEach(city => {
            const cacheKey = city.toLowerCase();
            if (this.cache.has(cacheKey)) {
                results[city] = this.cache.get(cacheKey);
            }
        });

        // Fetch uncached cities from API
        if (uncachedCities.length > 0) {
            try {
                const apiResults = await this.fetchFromAPI(uncachedCities);

                // Process API results and cache them
                uncachedCities.forEach(city => {
                    const apiResult = apiResults.find(result =>
                        result.searchTerm && result.searchTerm.toLowerCase() === city.toLowerCase()
                    );

                    let geoInfo;
                    if (apiResult && apiResult.found) {
                        geoInfo = {
                            city: city,
                            country: apiResult.country_name || 'unknown country match',
                            countryCode: apiResult.country_code || null,
                            continent: apiResult.continent || 'unknown continent match',
                            continentCode: apiResult.continent_code || null,
                            population: apiResult.population || null,
                            source: 'api'
                        };
                    } else {
                        // API didn't find the city, use fallback
                        geoInfo = this.getFallbackInfo(city);
                    }

                    // Cache the result
                    this.cache.set(city.toLowerCase(), geoInfo);
                    results[city] = geoInfo;
                });

            } catch (error) {
                console.error('Bulk API lookup failed:', error);

                // Fallback for all uncached cities
                uncachedCities.forEach(city => {
                    const geoInfo = this.getFallbackInfo(city);
                    this.cache.set(city.toLowerCase(), geoInfo);
                    results[city] = geoInfo;
                });
            }
        }

        return results;
    }

    /**
     * Fetch data from the cities API
     * @param {string[]} cities - Array of city names
     * @returns {Promise<Array>} API response results
     */
    async fetchFromAPI(cities) {
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cities: cities
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`API error: ${data.error} - ${data.message}`);
        }

        return data.results || [];
    }

    /**
     * Get fallback geographic info using simple string fallbacks
     * @param {string} cityName - Name of the city
     * @returns {Object} Geographic information
     */
    getFallbackInfo(cityName) {
        return {
            city: cityName,
            country: 'unknown country match',
            countryCode: null,
            continent: 'unknown continent match',
            continentCode: null,
            population: null,
            source: 'fallback'
        };
    }

    /**
     * Clear the cache - useful for testing or memory management
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
const geographicService = new GeographicService();
export default geographicService;

// Export class for testing
export {GeographicService};
