'use client';

import {setWorkerUrl} from 'maplibre-gl';

// MapLibre v6 no longer bundles its worker, it fetches it by URL at runtime. Next cannot emit that
// file in a usable form, so scripts/copy-maplibre-worker.mjs copies it to public/maplibre before dev
// and build, and this module points MapLibre at that copy.
//
// Import this module in every component that renders a map, before the map is created. Without it
// the map mounts and the style loads, but no vector tile is ever requested and nothing is logged.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
