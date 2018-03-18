const { parse, resolve } = require("path");
const { RawSource } = require("webpack-sources");

exports.NativeScriptWorkerPlugin = (function () {
    function NativeScriptWorkerPlugin({commonChunkName}) {
        this.files = {};
        this.commonChunkName = commonChunkName;
    }

    NativeScriptWorkerPlugin.prototype.apply = function (compiler) {
        compiler.plugin("this-compilation", (compilation) => {
            
            compilation.plugin(["optimize-chunks"], (chunks) => {
                if (!compilation.workerFiles) {
                    return;
                }

                const workersFullPath = [];

                for (const chunk of chunks) {
                    if (chunk._isWorkerExtractedIn) {
                        continue;
                    }
                    for (const module of chunk.modulesIterable) {
                        if (compilation.workerFiles.has(module.request)) {
                            const fileName = compilation.workerFiles.get(module.request)
                            const workerChunk = compilation.addChunk(fileName);
                            
                            workerChunk.filenameTemplate = fileName
                            chunk.moveModule(module, workerChunk);
                            workerChunk.entryModule = module;
                            workerChunk._isWorkerExtractedIn = true;

                            this.addAsset(compilation, fileName.replace(".worker.js", ".starter.js"), this.generateStarterModule(fileName))

                            workersFullPath.push(resolve(compiler.outputPath, fileName));
                        }
                    }
                }

                if (workersFullPath.length === 0) {
                    return;
                }
                
                const content = JSON.stringify(workersFullPath, null, 4);
                const source = new RawSource(content);
    
                compilation.assets["__worker-chunks.json"] = source;
            });            
        });
    };

    NativeScriptWorkerPlugin.prototype.generateStarterModule = function (worker) {
        // global.__worker is used to prevent loading UI related imports from the vendor chunk inside the worker
        return `
global = global || {};
global.__worker = true;
require("./${this.commonChunkName}");
require("./${parse(worker).name}");`
    }

    NativeScriptWorkerPlugin.prototype.addAsset = function(compilation, name, content) {
        if (this.files[name] !== content) {
            this.files[name] = content;
            compilation.assets[name] = new RawSource(content);
        }
    }

    return NativeScriptWorkerPlugin;
}());

