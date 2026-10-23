const root = require("path").join(__dirname, "..", "..");

module.exports =
  typeof process.versions.bun === "string"
    // Support `bun build --compile` by being statically analyzable enough to
    // find the .node addon if present.
    ? require(`${root}/prebuilds/${process.platform}-${process.arch}/tree-sitter-mailng_binding.node`)
    // Support `node-gyp-build`, which finds a prebuilt binary, or builds one.
    : require("node-gyp-build")(root);

try {
  module.exports.nodeTypeInfo = require("../../src/node-types.json");
} catch (_) {
  // The node type information is optional.
}
