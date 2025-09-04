import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    console.log('API route called');
    console.log('Current working directory:', process.cwd());
    
    // Try multiple possible paths to find the GeoJSON directory
    const possiblePaths = [
      path.join(process.cwd(), '..', 'geojson_scraper', 'harvard_geojsons'),
      path.join(process.cwd(), '..', '..', 'geojson_scraper', 'harvard_geojsons'),
      path.join(__dirname, '..', '..', '..', '..', '..', 'geojson_scraper', 'harvard_geojsons'),
      path.join('C:', 'Users', 'jmelp', 'Documents', 'Computational Spacial Humanitys', 'geojson_scraper', 'harvard_geojsons')
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
      }, { status: 404 });
    }
    
    // Read all GeoJSON files
    const files = fs.readdirSync(geojsonPath).filter(file => file.endsWith('.geojson'));
    console.log('Found files:', files.length);
    
    if (files.length === 0) {
      console.error('No GeoJSON files found in directory:', geojsonPath);
      return NextResponse.json({ 
        error: 'No GeoJSON files found',
        searchPath: geojsonPath
      }, { status: 404 });
    }
    
    const allData = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(geojsonPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const geojsonData = JSON.parse(fileContent);
        
        // Extract game info from filename (e.g., "combined_1896_Athens.geojson")
        const match = file.match(/combined_(\d{4})_(.+)\.geojson/);
        
        if (match && geojsonData.features) {
          const [, year, location] = match;
          
          // Determine season from the features data or location
          let season = 'Summer'; // default
          
          // Check if it's a winter Olympics based on known winter locations or sports
          const winterLocations = ['Chamonix', 'St._Moritz', 'Lake_Placid', 'Garmisch_Partenkirchen', 'Oslo', 'Cortina_d_Ampezzo', 'Squaw_Valley', 'Innsbruck', 'Grenoble', 'Sapporo', 'Calgary', 'Albertville', 'Lillehammer', 'Nagano', 'Salt_Lake_City', 'Turin', 'Vancouver', 'Sochi', 'Pyeongchang'];
          const winterSports = ['Ice Hockey', 'Figure Skating', 'Speed Skating', 'Bobsled', 'Luge', 'Ski Jumping', 'Alpine Skiing', 'Cross Country Skiing', 'Nordic Combined', 'Biathlon', 'Freestyle Skiing', 'Snowboarding', 'Skeleton', 'Curling', 'Short Track Speed Skating'];
          
          if (winterLocations.includes(location)) {
            season = 'Winter';
          } else {
            // Check sports in the features
            for (const feature of geojsonData.features) {
              if (feature.properties.sports) {
                const featureSports = Array.isArray(feature.properties.sports) ? feature.properties.sports : [feature.properties.sports];
                if (featureSports.some(sport => winterSports.includes(sport))) {
                  season = 'Winter';
                  break;
                }
              }
            }
          }
          
          allData.push({
            year: parseInt(year),
            season: season,
            location: location.replace(/_/g, ' '),
            filename: file,
            venueCount: geojsonData.features.length,
            features: geojsonData.features
          });
        }
      } catch (fileError) {
        console.warn(`Error processing file ${file}:`, fileError);
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
    return NextResponse.json({ error: 'Failed to load Olympic games data' }, { status: 500 });
  }
}
