const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  '@': require('path').resolve(__dirname, 'src'),
  '@utils': require('path').resolve(__dirname, 'utils'),
};

module.exports = config;
