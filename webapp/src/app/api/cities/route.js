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

// Simple in-memory rate limiter
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 10; // Maximum requests per IP per minute
const MAX_CITIES_PER_MINUTE = 1000; // Maximum cities processed per IP per minute

function getClientIP(request) {
    // Get client IP from various headers (for proxy/load balancer scenarios)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('x-forwarded-host') || 'unknown';

    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    return realIP || remoteAddr || 'unknown';
}

function checkRateLimit(clientIP, citiesCount = 0) {
    const now = Date.now();
    const clientKey = `rate_limit_${clientIP}`;

    // Get or create client data
    let clientData = rateLimitStore.get(clientKey) || {
        requests: [],
        citiesProcessed: []
    };

    // Clean up old requests (older than window)
    clientData.requests = clientData.requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    clientData.citiesProcessed = clientData.citiesProcessed.filter(entry => now - entry.timestamp < RATE_LIMIT_WINDOW);

    // Check request rate limit
    if (clientData.requests.length >= MAX_REQUESTS_PER_WINDOW) {
        const oldestRequest = Math.min(...clientData.requests);
        const resetTime = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW) / 1000);

        return {
            allowed: false,
            error: 'Rate limit exceeded',
            message: `Too many requests. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute.`,
            resetTime: resetTime,
            remaining: 0
        };
    }

    // Check cities processing rate limit
    const totalCitiesInWindow = clientData.citiesProcessed.reduce((sum, entry) => sum + entry.count, 0);
    if (totalCitiesInWindow + citiesCount > MAX_CITIES_PER_MINUTE) {
        return {
            allowed: false,
            error: 'Cities rate limit exceeded',
            message: `Too many cities processed. Maximum ${MAX_CITIES_PER_MINUTE} cities per minute. Currently processed: ${totalCitiesInWindow}`,
            resetTime: Math.ceil((now + RATE_LIMIT_WINDOW) / 1000),
            remaining: Math.max(0, MAX_CITIES_PER_MINUTE - totalCitiesInWindow)
        };
    }

    // Update rate limit data
    clientData.requests.push(now);
    if (citiesCount > 0) {
        clientData.citiesProcessed.push({
            timestamp: now,
            count: citiesCount
        });
    }

    rateLimitStore.set(clientKey, clientData);

    // Clean up old entries periodically (every 100 requests)
    if (rateLimitStore.size > 100) {
        const cutoff = now - RATE_LIMIT_WINDOW;
        for (const [key, data] of rateLimitStore.entries()) {
            const hasRecentActivity = data.requests.some(timestamp => timestamp > cutoff) ||
                data.citiesProcessed.some(entry => entry.timestamp > cutoff);
            if (!hasRecentActivity) {
                rateLimitStore.delete(key);
            }
        }
    }

    return {
        allowed: true,
        remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - clientData.requests.length),
        citiesRemaining: Math.max(0, MAX_CITIES_PER_MINUTE - totalCitiesInWindow),
        resetTime: Math.ceil((now + RATE_LIMIT_WINDOW) / 1000)
    };
}

function loadCitiesData() {
    if (citiesData) return citiesData;

    try {
        // Try multiple possible paths to find the cities file
        const fileName = "cities500.txt.columnar.json";
        const possiblePaths = [
            path.join(process.cwd(), 'cityParser', fileName),
            path.join(process.cwd(), '..', 'cityParser', fileName),
            path.join(process.cwd(), fileName),
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
        // Get client IP for rate limiting
        const clientIP = getClientIP(request);

        // Parse request body first to check cities count for rate limiting
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

        // Check rate limits
        const rateLimitResult = checkRateLimit(clientIP, cityNames.length);
        if (!rateLimitResult.allowed) {
            logger.warn('Rate limit exceeded for IP:', clientIP, rateLimitResult.message);
            return NextResponse.json(
                {
                    error: rateLimitResult.error,
                    message: rateLimitResult.message,
                    resetTime: rateLimitResult.resetTime,
                    remaining: rateLimitResult.remaining || 0
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': `${MAX_REQUESTS_PER_WINDOW}`,
                        'X-RateLimit-Remaining': `${rateLimitResult.remaining || 0}`,
                        'X-RateLimit-Reset': `${rateLimitResult.resetTime}`,
                        'X-RateLimit-Cities-Limit': `${MAX_CITIES_PER_MINUTE}`,
                        'X-RateLimit-Cities-Remaining': `${rateLimitResult.citiesRemaining || 0}`,
                        'Retry-After': `${Math.max(60, rateLimitResult.resetTime - Math.floor(Date.now() / 1000))}`
                    }
                }
            );
        }

        // Load cities data
        if (!citiesData) {
            loadCitiesData();
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
                'X-RateLimit-Limit': `${MAX_REQUESTS_PER_WINDOW}`,
                'X-RateLimit-Remaining': `${rateLimitResult.remaining}`,
                'X-RateLimit-Reset': `${rateLimitResult.resetTime}`,
                'X-RateLimit-Cities-Limit': `${MAX_CITIES_PER_MINUTE}`,
                'X-RateLimit-Cities-Remaining': `${rateLimitResult.citiesRemaining}`
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
