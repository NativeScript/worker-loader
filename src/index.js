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

const getPublicPath = file => {
    const root = JSON.stringify("./");
    const filePath = JSON.stringify(file);

    return `${root} + __webpack_public_path__ + ${filePath}`;
};

const getWorker = file => {
    const workerPublicPath = getPublicPath(file);
    return `new Worker(${workerPublicPath})`;
};

module.exports = function workerLoader() { };

const requests = [];

let pitchPromise = Promise.resolve();
module.exports.pitch = function pitch(request) {
    const callback = this.async();

    pitchPromise = pitchPromise.then(() =>
        new Promise((resolve) => {
            if (!this.webpack) {
                const error = new Error("Only usable with webpack");
                resolve();
                return callback(error);
            }

            const options = loaderUtils.getOptions(this) || {};
            const compilerOptions = this._compiler.options || {};
            const pluginOptions = compilerOptions.plugins.find(p => p[NATIVESCRIPT_WORKER_PLUGIN_SYMBOL]).options;

            // handle calls to itself to avoid an infinite loop
            if (requests.indexOf(request) === -1) {
                requests.push(request);
            } else {
                resolve();
                return callback(null, "");
            }

            try {
                validateSchema(optionsSchema, options, "Worker Loader");
            } catch (err) {
                resolve();
                return callback(err);
            }

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
                if (typeof plugin !== "string") {
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
            const plugin = { name: "WorkerLoader" };

            workerCompiler.hooks.thisCompilation.tap(plugin, compilation => {
                /**
                 * A dirty hack to disable HMR plugin in childCompilation:
                 * https://github.com/webpack/webpack/blob/4056506488c1e071dfc9a0127daa61bf531170bf/lib/HotModuleReplacementPlugin.js#L154
                 *
                 * Once we update to webpack@4.40.3 and above this can be removed:
                 * https://github.com/webpack/webpack/commit/1c4138d6ac04b7b47daa5ec4475c0ae1b4f596a2
                 */
                compilation.hotUpdateChunkTemplate = null;
            });

            workerCompiler.runAsChild((err, entries, childCompilation) => {
                if (err) {
                    resolve();
                    return callback(err);
                }

                if (entries[0]) {
                    const fileDeps = Array.from(childCompilation.fileDependencies);
                    this.clearDependencies();
                    fileDeps.forEach(fileName => {
                        this.addDependency(fileName);
                    });
                    /**
                     * Clears the hash of the child compilation as it affects the hash of the parent compilation:
                     * https://github.com/webpack/webpack/blob/4056506488c1e071dfc9a0127daa61bf531170bf/lib/Compilation.js#L2281
                     *
                     * If we don't clear the hash an emit of runtime.js and
                     * an empty [somehash].hot-update.json will happen on save without changes.
                     * This will restart the NS application.
                     */
                    childCompilation.hash = "";
                    const workerFile = entries[0].files[0];
                    this._compilation.workerChunks.push(workerFile);
                    const workerFactory = getWorker(workerFile);

                    // invalidate cache
                    const processedIndex = requests.indexOf(request);
                    if (processedIndex > -1) {
                        requests.splice(processedIndex, 1);
                    }

                    resolve();
                    return callback(null, `module.exports = function() {\n\treturn ${workerFactory};\n};`);
                }

                resolve();
                return callback(null, "");
            });
        }));
};
