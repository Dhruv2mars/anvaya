/** @type {import('expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("mjs", "cjs");
config.resolver.assetExts.push("wasm");

const emptyModule = path.resolve(__dirname, "metro.empty.js");
const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Node-only modules used by optional panchangam-js kundli PDF exporter.
  if (
    moduleName === "fs" ||
    moduleName === "node:fs" ||
    moduleName === "fs/promises" ||
    moduleName === "node:fs/promises"
  ) {
    return { type: "sourceFile", filePath: emptyModule };
  }
  // Avoid bundling the PDF exporter itself (it is unused by Anvaya).
  if (
    typeof moduleName === "string" &&
    (moduleName.includes("kundli/exporter") || moduleName.endsWith("/exporter"))
  ) {
    return { type: "sourceFile", filePath: emptyModule };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

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
