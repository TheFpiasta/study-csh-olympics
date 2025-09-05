import {NextResponse} from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        console.log('API route called');
        console.log('Current working directory:', process.cwd());

        // Try multiple possible paths to find the GeoJSON directory
        const possiblePaths = [
            path.join(process.cwd(), '..', 'geojson_scraper', '00_final_geojsons'),
            path.join(process.cwd(), '..', '..', 'geojson_scraper', '00_final_geojsons'),
            path.join(__dirname, '..', '..', '..', '..', '..', 'geojson_scraper', '00_final_geojsons'),
        ];

        let geojsonPath = null;

        for (const testPath of possiblePaths) {
            console.log('Testing path:', testPath);
            if (fs.existsSync(testPath)) {
                geojsonPath = testPath;
                console.log('Found valid path:', geojsonPath);
                break;
            }
        }

        if (!geojsonPath) {
            console.error('Could not find GeoJSON directory. Tested paths:', possiblePaths);
            return NextResponse.json({
                error: 'Olympic games data directory not found',
                testedPaths: possiblePaths,
                cwd: process.cwd()
            }, {status: 404});
        }

        // Read all GeoJSON files
        const files = fs.readdirSync(geojsonPath).filter(file => file.endsWith('.geojson'));
        console.log('Found files:', files.length);

        if (files.length === 0) {
            console.error('No GeoJSON files found in directory:', geojsonPath);
            return NextResponse.json({
                error: 'No GeoJSON files found',
                searchPath: geojsonPath
            }, {status: 404});
        }

        const allData = [];

        for (const file of files) {
            try {
                const filePath = path.join(geojsonPath, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const geojsonData = JSON.parse(fileContent);

                // Extract game info from filename (e.g., "combined_1896_Athens.geojson")
                const match = file.match(/(\d{4})_(.+)\.geojson/);
                console.log(`Processing file: ${file}, match: ${!!match}, features: ${geojsonData.features?.length || 0}`);

                if (match && geojsonData.features) {
                    const [, year, location] = match;

                    // Add season property to each feature based on the file year
                    const fileYear = parseInt(year);
                    const enhancedFeatures = geojsonData.features.map(feature => {
                        let season = ''; // default

                        // Look for a game in this feature that matches the file year
                        if (feature.properties.games && Array.isArray(feature.properties.games)) {
                            const matchingGame = feature.properties.games.find(game =>
                                parseInt(game.year) === fileYear
                            );
                            if (matchingGame && matchingGame.season) {
                                season = matchingGame.season;
                            }
                        }

                        if (season === '') {
                            console.error('No season found for ' + feature.properties.games);
                        }

                        return {
                            ...feature,
                            properties: {
                                ...feature.properties,
                                season: season
                            }
                        };
                    });

                    allData.push({
                        year: parseInt(year),
                        location: location.replace(/_/g, ' '),
                        filename: file,
                        venueCount: enhancedFeatures.length,
                        features: enhancedFeatures,
                        harvard: geojsonData.harvard || null
                    });
                }
            } catch (fileError) {
                console.warn(`Error processing file ${file}:`, fileError);
                console.warn(`File path: ${path.join(geojsonPath, file)}`);
            }
        }

        // Sort by year
        allData.sort((a, b) => a.year - b.year);

        console.log('Processed games:', allData.length);

        const result = {
            games: allData,
            totalGames: allData.length,
            totalVenues: allData.reduce((sum, game) => sum + game.venueCount, 0)
        };

        console.log('Returning result:', result.totalGames, 'games,', result.totalVenues, 'venues');

        return NextResponse.json(result, {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        console.error('Error loading all Olympic data:', error);
        return NextResponse.json({error: 'Failed to load Olympic games data'}, {status: 500});
    }
}
