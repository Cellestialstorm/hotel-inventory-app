const tsConfigPaths = require("tsconfig-paths");
const tsConfig = require("./tsconfig.json");

tsConfigPaths.register({
  baseUrl: __dirname + "/dist",
  paths: tsConfig.compilerOptions.paths
});
