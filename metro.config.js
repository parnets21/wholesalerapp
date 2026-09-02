const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Ensure .json files inside node_modules are resolvable (needed for
    // react-native-vector-icons glyphmaps/*.json)
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'json'],
  },
  watchFolders: [
    path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
  ],
};

module.exports = mergeConfig(defaultConfig, config);
