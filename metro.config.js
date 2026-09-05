const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// RN 0.81 requires explicit platform registration
config.resolver.platforms = ['android', 'ios', 'native'];

module.exports = config;
