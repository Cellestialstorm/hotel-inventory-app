import path from "path";
import { fileURLToPath } from "url";
import tsConfigPaths from "tsconfig-paths";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load tsconfig.json
const tsconfigPath = path.join(__dirname, "tsconfig.json");
const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));

// Correct dist directory
const distDir = path.join(__dirname, "dist");

// Build correct absolute runtime paths
const runtimePaths = {};
for (const [alias, paths] of Object.entries(tsconfig.compilerOptions.paths)) {
  runtimePaths[alias] = paths.map((p) => {
    const rel = p.replace("./src", "");            // removes "./src"
    return path.join(distDir, rel);                // adds "/dist"
  });
}

console.log("BOOTSTRAP: runtimePaths =", runtimePaths);

tsConfigPaths.register({
  baseUrl: distDir,
  paths: runtimePaths,
});

console.log("BOOTSTRAP: registered successfully");
