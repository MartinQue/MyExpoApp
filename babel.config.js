module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './',
          },
        },
      ],
      // NOTE: Reanimated plugin must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
