// Copies the MapLibre GL worker into public/maplibre so setWorkerUrl() can point at it.
//
// MapLibre v6 loads its worker from a URL at runtime instead of bundling it, so the file has to be
// reachable by the browser. Next turns new URL('maplibre-gl/dist/maplibre-gl-worker.mjs',
// import.meta.url) into a hashed asset without emitting the worker's maplibre-gl-shared.mjs sibling,
// and the worker then dies on its first relative import, which leaves the map mounted but without a
// single tile request. Both files have to land in the same directory because of that relative import.
//
// The copy runs from node_modules at build time, so it always matches the installed version.
import {copyFileSync, mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

const distDir = path.join(
    path.dirname(createRequire(import.meta.url).resolve('maplibre-gl/package.json')),
    'dist'
);
const targetDir = path.join(process.cwd(), 'public', 'maplibre');

mkdirSync(targetDir, {recursive: true});
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
    copyFileSync(path.join(distDir, file), path.join(targetDir, file));
}

console.log(`Copied MapLibre worker files to ${path.relative(process.cwd(), targetDir)}`);
