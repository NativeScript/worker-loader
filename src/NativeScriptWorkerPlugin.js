const { resolve } = require("path");
const { RawSource } = require("webpack-sources");

exports.NativeScriptWorkerPlugin = (function () {
    function NativeScriptWorkerPlugin() {
    }

    NativeScriptWorkerPlugin.prototype.apply = function (compiler) {
        compiler.plugin("emit", (compilation, cb) => {
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

