"use strict";

const { basename } = require("path");
const loaderUtils = require("loader-utils");
const validateOptions = require("schema-utils");
const optionsSchema = require("./options.json");

const validateSchema = (schema, options, pluginName) => {
    if (options.inline) {
        throw new Error("The NativeScript worker loader doesn't support inline workers!");
    }

    if (options.fallback === false) {
        throw new Error("The NativeScript worker loader " +
            "cannot be used without a fallback webworker script!");
    }

    validateOptions(schema, options, pluginName);
};

const getPublicPath = file => {
    const root = JSON.stringify("./");
    const filePath = JSON.stringify(file);

    return `${root} + __webpack_public_path__ + ${filePath}`;
};

const getWorker = file => {
    const workerPublicPath = getPublicPath(file);
    return `new Worker(${workerPublicPath})`;
};

module.exports = function workerLoader(content, map, meta) {
    this._compilation.workerFiles = this._compilation.workerFiles || new Map();

    const filenamePrefix = loaderUtils.interpolateName(this, "[hash]", {
        context: this.context,
        content,
    });

    this._compilation.workerFiles.set(this.data.path, `${filenamePrefix}.worker.js`);

    // require.context is used only to add the module as dependency so webpack can build it
    return `
module.exports = function() {
    require.context("~/", true, /${basename(this.data.path)}$/);
    return ${getWorker(filenamePrefix + ".starter.js")};
};`;
};

module.exports.pitch = function (request, preceding, data) {
    data.path = request;
};