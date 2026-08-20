module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['babel-plugin-transform-define', {
        'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify('app'),
        'process.env.EXPO_ROUTER_IMPORT_MODE': JSON.stringify('sync')
      }],
      ['@babel/plugin-transform-class-properties', { loose: false }],
      ['@babel/plugin-transform-private-methods', { loose: false }],
      ['@babel/plugin-transform-private-property-in-object', { loose: false }],
      'react-native-reanimated/plugin'
    ],
  };
};
