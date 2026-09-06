const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required by expo-sqlite's WebAssembly implementation on web.
config.resolver.assetExts.push('wasm');

module.exports = config;
