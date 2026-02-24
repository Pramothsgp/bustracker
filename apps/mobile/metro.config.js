// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');

const fs = require('fs');

// Fix Bun monorepo module resolution for Metro/Babel transform workers.
// Must run before any other requires so the patch is in place early.
const { getLookup, bunStoreExists } = require('./metro-bun-fix');
// Ensure Metro worker processes (spawned via jest-worker) also get the fix
const fixPath = path.resolve(__dirname, 'metro-bun-fix.js');
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --require "${fixPath}"`;

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo: watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Monorepo: resolve modules from both project and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Bun store fallback: build extraNodeModules map so Metro can find packages
// that Bun only stores in .bun/ without symlinking to node_modules/
if (bunStoreExists) {
  const extraNodeModules = {};
  const lookup = getLookup();
  for (const [name, dirs] of lookup) {
    const pkgPath = path.join(dirs[0], ...name.split('/'));
    if (fs.existsSync(pkgPath)) {
      extraNodeModules[name] = pkgPath;
    }
  }
  config.resolver.extraNodeModules = {
    ...extraNodeModules,
    ...config.resolver.extraNodeModules,
  };
}

module.exports = withNativeWind(config, { input: './global.css' });
