import {NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '../../../components/logger.js';

// Continent mapping
const CONTINENT_MAP = {
    'AF': 'Africa',
    'AS': 'Asia',
    'EU': 'Europe',
    'NA': 'North America',
    'OC': 'Oceania',
    'SA': 'South America',
    'AN': 'Antarctica'
};

let citiesData = null;
let countryData = null;

function loadCitiesData() {
    if (citiesData) return citiesData;

    try {
        // Try multiple possible paths to find the cities file
        const possiblePaths = [
            path.join(process.cwd(), 'cityParser', 'cities15000_columnar.json'),
            path.join(process.cwd(), '..', 'cityParser', 'cities15000_columnar.json'),
            path.join(process.cwd(), 'cities15000_columnar.json'),
        ];

        let citiesPath = null;

        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                citiesPath = testPath;
                logger.info('Found cities data at:', citiesPath);
                break;
            }
        }

        if (!citiesPath) {
            logger.error('Could not find cities15000_columnar.json. Tested paths:', possiblePaths);
            throw new Error('Cities data file not found');
        }

        const fileContent = fs.readFileSync(citiesPath, 'utf8');
        citiesData = JSON.parse(fileContent);
        logger.info('Loaded cities data with', citiesData.data.name.length, 'cities');

        return citiesData;
    } catch (error) {
        logger.error('Error loading cities data:', error);
        throw error;
    }
}

function loadCountryData() {
    if (countryData) return countryData;

    try {
        // Try multiple possible paths to find the country file
        const possiblePaths = [
            path.join(process.cwd(), 'cityParser', 'countryInfo_iso.json'),
            path.join(process.cwd(), '..', 'cityParser', 'countryInfo_iso.json'),
            path.join(process.cwd(), 'countryInfo_iso.json'),
        ];

        let countryPath = null;

        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                countryPath = testPath;
                logger.info('Found country data at:', countryPath);
                break;
            }
        }

        if (!countryPath) {
            logger.error('Could not find countryInfo_iso.json. Tested paths:', possiblePaths);
            logger.warn('Falling back to hardcoded continent mapping');
            return null;
        }

        const fileContent = fs.readFileSync(countryPath, 'utf8');
        countryData = JSON.parse(fileContent);
        logger.info('Loaded country data with', Object.keys(countryData.countries).length, 'countries');

        return countryData;
    } catch (error) {
        logger.error('Error loading country data:', error);
        logger.warn('Falling back to hardcoded continent mapping');
        return null;
    }
}

function getCountryInfo(countryCode) {
    try {
        if (!countryData) {
            loadCountryData();
        }

        if (countryData && countryData.countries && countryData.countries[countryCode]) {
            const country = countryData.countries[countryCode];
            return {
                continent_code: country.continent,
                continent: CONTINENT_MAP[country.continent] || 'Unknown',
                country_name: country.country,
                currency: country.currency
            };
        }

        // Fallback to unknown if not found
        return {
            continent_code: 'Unknown',
            continent: 'Unknown',
            country_name: 'Unknown',
            currency: {code: null, name: null}
        };
    } catch (error) {
        logger.error('Error getting country info for', countryCode, ':', error);
        return {
            continent_code: 'Unknown',
            continent: 'Unknown',
            country_name: 'Unknown',
            currency: {code: null, name: null}
        };
    }
}

function searchCity(cityName) {
    const data = citiesData.data;
    const searchTerm = cityName.toLowerCase().trim();

    // Search in name field
    let matchIndex = data.name.findIndex(name =>
        name && name.toLowerCase() === searchTerm
    );

    // Search in asciiname field if not found
    if (matchIndex === -1) {
        matchIndex = data.asciiname.findIndex(asciiName =>
            asciiName && asciiName.toLowerCase() === searchTerm
        );
    }

    // Search in alternatenames if still not found
    if (matchIndex === -1) {
        matchIndex = data.alternatenames.findIndex(alternates => {
            if (!Array.isArray(alternates)) return false;
            return alternates.some(altName =>
                altName && altName.toLowerCase() === searchTerm
            );
        });
    }

    return matchIndex;
}

function searchCityAndGetResult(cityName) {
    const matchIndex = searchCity(cityName);

    if (matchIndex === -1) {
        // Full result object for not found (commented out - uncomment for detailed response)
        // return {
        //     searchTerm: cityName,
        //     found: false,
        //     error: 'City not found',
        //     city: null,
        //     country_code: null,
        //     country_name: null,
        //     timezone: null,
        //     population: null,
        //     continent: null,
        //     continent_code: null,
        //     currency: null,
        //     additional_info: null
        // };

        // Short result object for not found (current)
        return {
            searchTerm: cityName,
            found: false,
            error: 'City not found',
            country_code: null,
            country_name: null,
            population: null,
            continent: null,
            continent_code: null
        };
    }

    // Extract data using the found index
    const data = citiesData.data;
    const countryCode = data.country_code[matchIndex];
    const countryInfo = getCountryInfo(countryCode);

    // Full result object (commented out - uncomment for detailed response)
    // return {
    //     searchTerm: cityName,
    //     found: true,
    //     city: {
    //         name: data.name[matchIndex],
    //         asciiname: data.asciiname[matchIndex],
    //         geonameid: data.geonameid[matchIndex],
    //         coordinates: {
    //             latitude: data.latitude[matchIndex],
    //             longitude: data.longitude[matchIndex]
    //         }
    //     },
    //     country_code: countryCode,
    //     country_name: countryInfo.country_name,
    //     timezone: data.timezone[matchIndex],
    //     population: data.population[matchIndex],
    //     continent: countryInfo.continent,
    //     continent_code: countryInfo.continent_code,
    //     currency: countryInfo.currency,
    //     additional_info: {
    //         feature_class: data.feature_class[matchIndex],
    //         feature_code: data.feature_code[matchIndex],
    //         elevation: data.elevation[matchIndex],
    //         dem: data.dem[matchIndex],
    //         modification_date: data.modification_date[matchIndex],
    //         alternate_names: data.alternatenames[matchIndex] || []
    //     }
    // };

    // Short result object (current)
    return {
        searchTerm: cityName,
        found: true,
        country_code: countryCode,
        country_name: countryInfo.country_name,
        population: data.population[matchIndex],
        continent: countryInfo.continent,
        continent_code: countryInfo.continent_code
    };
}

export async function POST(request) {
    try {
        // Load cities data
        if (!citiesData) {
            loadCitiesData();
        }

        // Parse request body
        const body = await request.json();

        // Validate request body
        if (!body || !Array.isArray(body.cities)) {
            return NextResponse.json(
                {
                    error: 'Invalid request body',
                    message: 'Expected JSON body with "cities" array',
                    usage: {
                        method: 'POST',
                        endpoint: '/api/cities',
                        body: {
                            cities: ['London', 'Paris', 'Tokyo']
                        }
                    }
                },
                {status: 400}
            );
        }

        const cityNames = body.cities;

        if (cityNames.length === 0) {
            return NextResponse.json(
                {
                    error: 'Empty cities array',
                    message: 'Please provide at least one city name'
                },
                {status: 400}
            );
        }

        if (cityNames.length > 50) {
            return NextResponse.json(
                {
                    error: 'Too many cities',
                    message: 'Maximum 50 cities allowed per request'
                },
                {status: 400}
            );
        }

        logger.info('Searching for', cityNames.length, 'cities:', cityNames);

        // Search for all cities
        const results = [];
        let foundCount = 0;
        let notFoundCount = 0;

        for (const cityName of cityNames) {
            if (typeof cityName !== 'string' || !cityName.trim()) {
                results.push({
                    searchTerm: cityName,
                    found: false,
                    error: 'Invalid city name',
                    country_code: null,
                    country_name: null,
                    population: null,
                    continent: null,
                    continent_code: null
                });
                notFoundCount++;
                continue;
            }

            const result = searchCityAndGetResult(cityName.trim());
            results.push(result);

            if (result.found) {
                foundCount++;
            } else {
                notFoundCount++;
            }
        }

        const response = {
            summary: {
                total_searched: cityNames.length,
                found: foundCount,
                not_found: notFoundCount
            },
            results: results
        };

        logger.info('Bulk search completed:', foundCount, 'found,', notFoundCount, 'not found');

        return NextResponse.json(response, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour since city data is relatively static
            }
        });

    } catch (error) {
        logger.error('Error in cities API:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message
            },
            {status: 500}
        );
    }
}
