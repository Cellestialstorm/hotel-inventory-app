console.log("BOOTSTRAP: Loaded");
console.log("BOOTSTRAP: __dirname =", __dirname);
console.log("BOOTSTRAP: cwd =", process.cwd());
console.log("BOOTSTRAP: attempting to load tsconfig.json");

const fs = require("fs");
const path = require("path");

try {
  const tsconfigPath = path.join(__dirname, "tsconfig.json");
  console.log("BOOTSTRAP: tsconfig path =", tsconfigPath);
  console.log("BOOTSTRAP: tsconfig exists =", fs.existsSync(tsconfigPath));

  const tsConfigPaths = require("tsconfig-paths");
  const tsConfig = require(tsconfigPath);

  console.log("BOOTSTRAP: tsconfig loaded");

  // Rewrite paths
  const runtimePaths = {};
  for (const [alias, paths] of Object.entries(tsConfig.compilerOptions.paths)) {
    runtimePaths[alias] = paths.map(p => p.replace("./src", "./dist"));
  }

  console.log("BOOTSTRAP: registering runtime paths =", runtimePaths);

  tsConfigPaths.register({
    baseUrl: path.join(__dirname, "dist"),
    paths: runtimePaths
  });

  console.log("BOOTSTRAP: registered successfully");
} catch (e) {
  console.error("BOOTSTRAP ERROR:", e);
}
