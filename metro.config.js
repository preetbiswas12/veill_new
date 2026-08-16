const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'expo-crypto': require.resolve('./stubs/expo-crypto-stub.js'),
};

module.exports = config;
