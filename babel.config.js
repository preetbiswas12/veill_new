module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: process.env.BABEL_ENV === 'production' 
      ? [] 
      : ['react-native-reanimated/plugin'],
  };
};