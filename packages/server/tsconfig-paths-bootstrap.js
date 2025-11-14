const tsConfigPaths = require("tsconfig-paths");
const path = require("path");

const tsConfig = require("./tsconfig.json");

// Convert all src paths → dist paths
const runtimePaths = {};
for (const [alias, paths] of Object.entries(tsConfig.compilerOptions.paths)) {
  runtimePaths[alias] = paths.map(p =>
    p.replace("./src", "./dist")
  );
}

tsConfigPaths.register({
  baseUrl: path.join(__dirname, "dist"),
  paths: runtimePaths
});
