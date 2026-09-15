const Module = require("module");
const path = require("node:path");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "server-only") return path.join(__dirname, "server-only-stub.js");
  return orig.call(this, request, ...args);
};
