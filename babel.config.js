module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['babel-plugin-transform-define', {
        'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify('app')
      }]
    ],
  };
};
