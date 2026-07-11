/** @type {import('expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("mjs", "cjs");
config.resolver.assetExts.push("wasm");

const previousEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, server) => {
    const base = previousEnhance ? previousEnhance(middleware, server) : middleware;
    return (req, res, next) => {
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      return base(req, res, next);
    };
  },
};

module.exports = config;
