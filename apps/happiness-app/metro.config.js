const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];
// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Add .vrm files as assets so they can be imported
// Ensure assetExts is an array and add vrm extension
if (!config.resolver.assetExts) {
  config.resolver.assetExts = [];
}
if (!config.resolver.assetExts.includes('vrm')) {
  config.resolver.assetExts.push('vrm');
}

module.exports = config;



