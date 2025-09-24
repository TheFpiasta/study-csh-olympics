import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import logger from '../../../../components/logger.js';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    // Path to the geojson_scraper folder (go up from webapp to parent directory)
    const geojsonPath = path.join(process.cwd(), '..', 'geojson_scraper', '00_final_geojsons', `${slug}.geojson`);
    
    // Check if file exists
    if (!fs.existsSync(geojsonPath)) {
      return NextResponse.json({ error: 'Olympic games data not found' }, { status: 404 });
    }
    
    // Read and parse the GeoJSON file
    const fileContent = fs.readFileSync(geojsonPath, 'utf8');
    const geojsonData = JSON.parse(fileContent);
    
    // Return the GeoJSON data with proper headers
    return NextResponse.json(geojsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    });
    
  } catch (error) {
      logger.error('Error loading Olympic data:', error);
    return NextResponse.json({ error: 'Failed to load Olympic games data' }, { status: 500 });
  }
}