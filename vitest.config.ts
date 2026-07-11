import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Match Metro: force CJS so Observer instanceof checks pass with panchangam-js.
      "astronomy-engine": path.resolve(
        __dirname,
        "node_modules/astronomy-engine/astronomy.js",
      ),
    },
  },
});
