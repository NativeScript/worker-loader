"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const del = require("del");
const webpack = require("webpack");
const { NativeScriptWorkerPlugin } = require("../NativeScriptWorkerPlugin");

process.chdir(__dirname);

const contains = (first, second) => first.indexOf(second) > -1;

if (!Object.prototype.hasOwnProperty.call(assert, "contains")) {
    assert.contains = (first, second) => assert.ok(contains(first, second));
}

const readFile = file => fs.readFileSync(file, "utf-8");

const makeBundle = (name, options) => del(`expected/${name}`).then(() => {
    const config = Object.assign({
        entry: `./fixtures/${name}/entry.js`,
        output: {
            path: path.join(__dirname, `expected/${name}`),
            filename: "bundle.js",
        },
        plugins: [
            new NativeScriptWorkerPlugin(),
        ],
    }, options);
    const bundle = webpack(config);

    return new Promise((resolve, reject) => {
        bundle.run((err, stats) => {
            if (err) {
                return reject(err);
            }

            if (stats.compilation.errors.length) {
                return reject(Error(stats.toString("errors-only")));
            }

            return resolve(stats);
        });
    });
});

const getAssetsMeta = stats => stats.toJson().assets;

const getChunksMeta = stats => stats.toJson().children
    .map(item => item.chunks)
    .reduce((acc, item) => acc.concat(item), [])
    .map(item => item.files);

const getChunks = (stats, testName) => getChunksMeta(stats).map(item => `expected/${testName}/${item}`);

describe("worker-loader", () => {
    const inlineOptionErrorMessage = "The NativeScript worker loader doesn't support inline workers!";
    const noFallbackOptionErrorMessage = "The NativeScript worker loader cannot be used without a fallback webworker script!";

    const statsFileIsCorrect = async (stats, testName) => {
        const assets = getAssetsMeta(stats);
        const workerStatsAssetMeta = assets.find(f => f.name === "__worker-chunks.json");
        await assert.ok(workerStatsAssetMeta);

        const chunks = getChunksMeta(stats);
        const workerStatsFilePath = `expected/${testName}/${workerStatsAssetMeta.name}`;
        const workerStatsFile = await readFile(workerStatsFilePath);

        return chunks.every(chunk => contains(workerStatsFile, chunk));
    };

    it("should create chunk with worker", async () => {
        const testName = "worker";
        const stats = await makeBundle(testName);

        const files = getChunks(stats, testName);
        assert.equal(files.length, 1);

        const content = await readFile(files[0]);
        await assert.contains(content, "// worker test mark");

        assert.ok(await statsFileIsCorrect(stats, testName));
    });

    it("should create chunk with specified name in query", async () => {
        const testName = "name-query";
        const stats = await makeBundle(testName);
        const file = getChunks(stats, testName)[0];
        assert.equal(file, `expected/${testName}/namedWorker.js`);

        const content = await readFile(file);
        await assert.contains(content, "// named worker test mark");

        assert.ok(await statsFileIsCorrect(stats, testName));
    });

    it("should create named chunks with workers via options", async () => {
        const testName = "name-options";
        const stats = await makeBundle(testName, {
            module: {
                rules: [
                    {
                        test: /(w1|w2)\.js$/,
                        loader: "../index.js",
                        options: {
                            name: "[name].js",
                        },
                    },
                ],
            },
        });

        const files = getChunks(stats, testName).sort();
        assert.equal(files.length, 2);

        const [first, second] = files;

        assert.equal(first, `expected/${testName}/w1.js`);
        assert.equal(second, `expected/${testName}/w2.js`);

        const [firstContent, secondContent] = files.map(readFile);

        await assert.contains(firstContent, "// w1 via worker options");
        await assert.contains(secondContent, "// w2 via worker options");

        assert.ok(await statsFileIsCorrect(stats, testName));
    });

    it("should throw with inline option in query", () =>
        makeBundle("inline-query")
            .catch(error => assert.contains(error.message, inlineOptionErrorMessage))
    );

    it("should throw with inline in options", () =>
        makeBundle("inline-options", {
            module: {
                rules: [
                    {
                        test: /(w1|w2)\.js$/,
                        loader: "../index.js",
                        options: {
                            inline: true,
                        },
                    },
                ],
            },
        }).catch(error => assert.contains(error.message, inlineOptionErrorMessage))
    );

    it("should throw with fallback === false", () =>
        makeBundle("no-fallbacks", {
            module: {
                rules: [
                    {
                        test: /(w1|w2)\.js$/,
                        loader: "../index.js",
                        options: {
                            fallback: false,
                        },
                    },
                ],
            },
        }).catch(error => assert.contains(error.message, noFallbackOptionErrorMessage))
    );

    ["node", "async-node", "node-webkit", "atom", "electron", "electron-main", "electron-renderer"].forEach((target) => {
        it(`should not have missing dependencies (${target})`, () =>
            makeBundle("nodejs-core-modules", {
                target,
                module: {
                    rules: [
                        {
                            test: /worker\.js$/,
                            loader: "../index.js",
                            options: {
                                inline: true,
                                fallback: false,
                            },
                        },
                    ],
                },
            }).then((stats) => {
                assert.equal(stats.compilation.missingDependencies.length, 0);
            })
        );
    });
});
