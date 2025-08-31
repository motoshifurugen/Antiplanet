const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Suppress Three.js warnings by setting environment variable
process.env.SUPPRESS_THREE_JS_WARNINGS = 'true';

module.exports = config;
