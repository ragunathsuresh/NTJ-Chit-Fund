/**
 * patch-expo-cli.js
 * 
 * Automatically patches @expo/cli's externals.js to fix a Windows-specific
 * crash where it tries to create a directory named "node:sea" — colons are
 * illegal in Windows paths.
 * 
 * This script runs automatically after every `npm install` via "postinstall".
 */

const fs = require('fs');
const path = require('path');

const externalsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo', 'cli', 'build', 'src', 'start', 'server', 'metro', 'externals.js'
);

if (!fs.existsSync(externalsPath)) {
  console.log('[patch-expo-cli] externals.js not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(externalsPath, 'utf8');

const OLD = `        const shimDir = _path.default.join(projectRoot, METRO_EXTERNALS_FOLDER, moduleId);`;
const NEW = `        // PATCHED: strip "node:" prefix so Windows doesn't choke on colons in dir names
        const safeDirName = moduleId.replace(/^node:/, "");
        const shimDir = _path.default.join(projectRoot, METRO_EXTERNALS_FOLDER, safeDirName);`;

if (content.includes('PATCHED:')) {
  console.log('[patch-expo-cli] Already patched, skipping.');
  process.exit(0);
}

if (!content.includes(OLD)) {
  console.log('[patch-expo-cli] Target line not found — @expo/cli may have changed, skipping.');
  process.exit(0);
}

content = content.replace(OLD, NEW);
fs.writeFileSync(externalsPath, content, 'utf8');
console.log('[patch-expo-cli] ✅ Successfully patched externals.js for Windows compatibility.');
