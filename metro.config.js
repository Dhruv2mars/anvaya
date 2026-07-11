/** @type {import('expo/metro-config').MetroConfig} */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("mjs", "cjs");
config.resolver.assetExts.push("wasm");

const emptyModule = path.resolve(__dirname, "metro.empty.js");
const previousResolveRequest = config.resolver.resolveRequest;

// Belt-and-suspenders: stub Node builtins even if a dependency still pulls them.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  fs: emptyModule,
  "fs/promises": emptyModule,
  "node:fs": emptyModule,
  "node:fs/promises": emptyModule,
};

// Never bundle the kundli PDF exporter (Node-only, unused).
const exporterBlock =
  /node_modules[/\\]@ishubhamx[/\\]panchangam-js[/\\]dist[/\\]kundli[/\\]exporter\.js$/;
const existingBlock = config.resolver.blockList;
config.resolver.blockList = Array.isArray(existingBlock)
  ? [...existingBlock, exporterBlock]
  : existingBlock
    ? [existingBlock, exporterBlock]
    : [exporterBlock];

const astronomyCjs = path.resolve(
  __dirname,
  "node_modules/astronomy-engine/astronomy.js",
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force CJS astronomy-engine so Observer instanceof matches panchangam-js.
  if (moduleName === "astronomy-engine") {
    return { type: "sourceFile", filePath: astronomyCjs };
  }
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
    (moduleName.includes("kundli/exporter") ||
      moduleName === "./exporter" ||
      moduleName.endsWith("/exporter"))
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
