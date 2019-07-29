"use strict";

const loaderUtils = require("loader-utils");
const validateOptions = require("schema-utils");
const WebWorkerTemplatePlugin = require("webpack/lib/webworker/WebWorkerTemplatePlugin");
const NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");
const SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
const optionsSchema = require("./options.json");
const NATIVESCRIPT_WORKER_PLUGIN_SYMBOL = require("./symbol");

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

const getPublicPath = (file, customDomain) => {
    const root = customDomain ? "" : JSON.stringify("./ + ");
    const filePath = JSON.stringify(file);

    return `${root}__webpack_public_path__ + ${filePath}`;
};

const getWorker = (file, customDomain) => {
    const workerPublicPath = getPublicPath(file, customDomain);
    return `new Worker(${workerPublicPath})`;
};

module.exports = function workerLoader() { };

const requests = [];

module.exports.pitch = function pitch(request) {
    if (!this.webpack) {
        throw new Error("Only usable with webpack");
    }

    this.cacheable(false);
    const callback = this.async();
    const options = loaderUtils.getOptions(this) || {};
    const compilerOptions = this._compiler.options || {};
    const pluginOptions = compilerOptions.plugins.find(p => p[NATIVESCRIPT_WORKER_PLUGIN_SYMBOL]).options;

    // handle calls to itself to avoid an infinite loop
    if (requests.indexOf(request) === -1) {
        requests.push(request);
    } else {
        return callback(null, "");
    }

    validateSchema(optionsSchema, options, "Worker Loader");
    if (!this._compilation.workerChunks) {
        this._compilation.workerChunks = [];
    }

    const filename = loaderUtils.interpolateName(this, options.name || "[hash].worker.js", {
        context: options.context || this.rootContext,
        regExp: options.regExp,
    });

    const outputOptions = {
        filename,
        chunkFilename: `[id].${filename}`,
        namedChunkFilename: null,
    };

    const plugins = (pluginOptions.plugins || []).map(plugin => {
        if (typeof plugin !== 'string') {
            return plugin;
        }
        const found = compilerOptions.plugins.find(p => p.constructor.name === plugin);
        if (!found) {
            console.warn(`Warning (worker-plugin): Plugin "${plugin}" is not found.`);
        }
        return found;
    });

    const workerCompiler = this._compilation.createChildCompiler("worker", outputOptions, plugins);
    new WebWorkerTemplatePlugin(outputOptions).apply(workerCompiler);
    if (this.target !== "webworker" && this.target !== "web") {
        new NodeTargetPlugin().apply(workerCompiler);
    }

    new SingleEntryPlugin(this.context, `!!${request}`, "main").apply(workerCompiler);

    const subCache = `subcache ${__dirname} ${request}`;
    const plugin = { name: "WorkerLoader" };

    workerCompiler.hooks.compilation.tap(plugin, compilation => {
        if (compilation.cache) {
            compilation.cache = compilation.cache[subCache] || {};
        }
    });

    workerCompiler.runAsChild((err, entries) => {
        if (err) {
            return callback(err);
        }

        if (entries[0]) {
            const workerFile = entries[0].files[0];
            this._compilation.workerChunks.push(workerFile);
            const workerFactory = getWorker(workerFile, options.customDomain);

            // invalidate cache
            const processedIndex = requests.indexOf(request);
            if (processedIndex > -1) {
                requests.splice(processedIndex, 1);
            }

            return callback(null, `module.exports = function() {\n\treturn ${workerFactory};\n};`);
        }

        return callback(null, "");
    });
};

