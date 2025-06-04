
import chokidar from 'chokidar';

// Replace this with whatever you were including in TSX:
const INCLUDE_GLOB = 'node_modules/@env-hopper';

const watcher = chokidar.watch(INCLUDE_GLOB, {
  // replicate TSX’s defaults:
  ignored: ['**/node_modules/**'],
  ignoreInitial: true,
  followSymlinks: true,
});

watcher
  .on('all', (event, path) => {
    console.log(`[chokidar event] ${event}: ${path}`);
  })
  .on('error', (err) => {
    console.error('Error:', err);
  });

console.log('⏳ Chokidar is watching →', INCLUDE_GLOB);
