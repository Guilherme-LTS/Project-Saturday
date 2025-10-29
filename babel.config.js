module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Correctly wrap the plugin and its options in an array
      ['module-resolver', {
        alias: {
          '@': './'
        }
      }],
      'react-native-reanimated/plugin'
    ],
  };
};
