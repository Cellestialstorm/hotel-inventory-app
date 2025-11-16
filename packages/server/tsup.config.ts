import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  format: ["cjs"],        // output CommonJS (best for Node/Render)
  target: "node20",
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,             // no need for declaration files for server
  minify: false,

  // IMPORTANT: supports path aliases (from tsconfig.json)
  tsconfig: "./tsconfig.json",

  // allows "@/models/User.model" to resolve cleanly
  treeshake: false
});
