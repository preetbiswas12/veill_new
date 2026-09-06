const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    ...defaultConfig.resolver,

    // Support .mjs files
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs'],
  },

  transformer: {
    ...defaultConfig.transformer,
  },
};

module.exports = mergeConfig(defaultConfig, config);