const { resolve } = require("path");
const { RawSource } = require("webpack-sources");
const NATIVESCRIPT_WORKER_PLUGIN_SYMBOL = require("./symbol");

exports.NativeScriptWorkerPlugin = (function () {
    function NativeScriptWorkerPlugin(options) {
        this.options = options || {};
        this[NATIVESCRIPT_WORKER_PLUGIN_SYMBOL] = true;
    }

    NativeScriptWorkerPlugin.prototype.apply = function (compiler) {
        compiler.hooks.emit.tapAsync("NativeScriptWorkerPlugin", (compilation, cb) => {
            if (!compilation.workerChunks) {
                return cb();
            }

            const output = compiler.outputPath;
            const workersFullPath = compilation.workerChunks
                .map(chunk => resolve(output, chunk));

            const content = JSON.stringify(workersFullPath, null, 4);
            const source = new RawSource(content);

            compilation.assets["__worker-chunks.json"] = source;

            cb();
        });
    };

    return NativeScriptWorkerPlugin;
}());

