// Learn more: https://docs.expo.dev/guides/customizing-metro/
const {getDefaultConfig} = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Solution for "require doesn't exist" error with Expo SDK 54 and Hermes
// See: https://github.com/expo/expo/issues/39474

// Disable ES Module exports resolution to use classic CommonJS resolution
config.resolver.unstable_enablePackageExports = false;

// Force CommonJS-style resolution conditions
config.resolver.unstable_conditionNames = ['require', 'react-native', 'default'];

// Ensure proper source extensions are used
config.resolver.sourceExts = ['expo.ts', 'expo.tsx', 'expo.js', 'expo.jsx', 'ts', 'tsx', 'js', 'jsx', 'json', 'cjs', 'mjs'];

// Fix 4: Disable Hermes bytecode to serve plain JS
config.transformer = {
  ...config.transformer,
  hermesParser: true,
  unstable_disableModuleWrapping: false,
};

// Fix 5: Disable lazy bundling which can cause require issues
config.server = {
  ...config.server,
};

module.exports = config;
