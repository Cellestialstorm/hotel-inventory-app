import path from "path";
import { fileURLToPath } from "url";
import tsConfigPaths from "tsconfig-paths";
import fs from "fs";

// ESM replacements for __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("BOOTSTRAP: Loaded");
console.log("BOOTSTRAP: __dirname =", __dirname);
console.log("BOOTSTRAP: cwd =", process.cwd());

const tsconfigPath = path.join(__dirname, "tsconfig.json");
console.log("BOOTSTRAP: tsconfig path =", tsconfigPath);
console.log("BOOTSTRAP: tsconfig exists =", fs.existsSync(tsconfigPath));

const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, "utf8"));

const distDir = path.join(__dirname, "dist");

// Convert all alias paths from src → dist
const runtimePaths = {};
for (const [alias, paths] of Object.entries(tsconfig.compilerOptions.paths)) {
  runtimePaths[alias] = paths.map((p) =>
    path.resolve(distDir, p.replace("./src", ""))
  );
}

console.log("BOOTSTRAP: runtimePaths =", runtimePaths);

tsConfigPaths.register({
  baseUrl: distDir,
  paths: runtimePaths,
});

console.log("BOOTSTRAP: registered successfully");
