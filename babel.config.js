module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // Correctly wrap the plugin and its options in an array
      ['module-resolver', {
        alias: {
          '@': './'
        }
      }]
    ],
  };
};
