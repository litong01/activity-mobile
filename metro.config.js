const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Use port 8082 so Metro never tries 8081 (and never prompts "port 8081 in use, use 8082?").
config.server.port = 8082;

module.exports = config;
