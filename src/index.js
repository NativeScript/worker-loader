"use strict";

const loaderUtils = require("loader-utils");
const validateOptions = require("schema-utils");
const WebWorkerTemplatePlugin = require("webpack/lib/webworker/WebWorkerTemplatePlugin");
const NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");
const SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
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

module.exports = function workerLoader() {};

module.exports.pitch = function pitch(request) {
    if (!this.webpack) {
        throw new Error("Only usable with webpack");
    }

    this.cacheable(false);
    const callback = this.async();
    const options = loaderUtils.getOptions(this) || {};
    validateSchema(optionsSchema, options, "Worker Loader");
    this._compilation.workerChunks = [];

    const filename = loaderUtils.interpolateName(this, options.name || "[hash].worker.js", {
        context: options.context || this.options.context,
        regExp: options.regExp,
    });

    const outputOptions = {
        filename,
        chunkFilename: `[id].${filename}`,
        namedChunkFilename: null,
    };

    if (this.options && this.options.worker && this.options.worker.output) {
        Object.keys(this.options.worker.output).forEach((name) => {
            outputOptions[name] = this.options.worker.output[name];
        });
    }

    const workerCompiler = this._compilation.createChildCompiler("worker", outputOptions);
    workerCompiler.apply(new WebWorkerTemplatePlugin(outputOptions));
    if (this.target !== "webworker" && this.target !== "web") {
        workerCompiler.apply(new NodeTargetPlugin());
    }

    workerCompiler.apply(new SingleEntryPlugin(this.context, `!!${request}`, "main"));
    if (this.options && this.options.worker && this.options.worker.plugins) {
        this.options.worker.plugins.forEach(plugin => workerCompiler.apply(plugin));
    }

    const subCache = `subcache ${__dirname} ${request}`;
    workerCompiler.plugin("compilation", compilation => {
        if (compilation.cache) {
            if (!compilation.cache[subCache]) {
                compilation.cache[subCache] = {};
            }
            compilation.cache = compilation.cache[subCache];
        }
    });

    workerCompiler.runAsChild((err, entries) => {
        if (err) {
            return callback(err);
        }

        if (entries[0]) {
            const workerFile = entries[0].files[0];
            this._compilation.workerChunks.push(workerFile);
            const workerFactory = getWorker(workerFile);

            return callback(null, `module.exports = function() {\n\treturn ${workerFactory};\n};`);
        }

        return callback(null, null);
    });
};

