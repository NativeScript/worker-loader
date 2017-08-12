"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const del = require("del");
const webpack = require("webpack");

process.chdir(__dirname);

if (!Object.prototype.hasOwnProperty.call(assert, "contains")) {
    assert.contains = (first, second) => first.indexOf(second) > -1;
}

const readFile = file => fs.readFileSync(file, "utf-8");

const makeBundle = (name, options) => del(`expected/${name}`).then(() => {
    const config = Object.assign({
        entry: `./fixtures/${name}/entry.js`,
        output: {
            path: path.join(__dirname, `expected/${name}`),
            filename: "bundle.js",
        },
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

const inlineOptionErrorMessage = "The NativeScript wworker loader doesn't support inline workers!";
const noFallbackOptionErrorMessage = "The NativeScript worker loader cannot be used without a fallback webworker script!";

describe("worker-loader", () => {
    it("should create chunk with worker", () =>
        makeBundle("worker").then((stats) => {
            const files = stats.toJson().children
                .map(item => item.chunks)
                .reduce((acc, item) => acc.concat(item), [])
                .map(item => item.files)
                .map(item => `expected/worker/${item}`);
            assert.equal(files.length, 1);
            assert.notEqual(readFile(files[0]).indexOf("// worker test mark"), -1);
        })
    );

    it("should create chunk with specified name in query", () =>
        makeBundle("name-query").then((stats) => {
            const files = stats.toJson().children
                .map(item => item.chunks)
                .reduce((acc, item) => acc.concat(item), [])
                .map(item => item.files)
                .map(item => `expected/name-query/${item}`);
            assert.equal(files[0], "expected/name-query/namedWorker.js");
            assert.notEqual(readFile(files[0]).indexOf("// named worker test mark"), -1);
        })
    );

    it("should create named chunks with workers via options", () =>
        makeBundle("name-options", {
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
        }).then((stats) => {
            const files = stats.toJson().children
                .map(item => item.chunks)
                .reduce((acc, item) => acc.concat(item), [])
                .map(item => item.files)
                .map(item => `expected/name-options/${item}`)
                .sort();
            assert.equal(files.length, 2);
            assert.equal(files[0], "expected/name-options/w1.js");
            assert.equal(files[1], "expected/name-options/w2.js");
            assert.notEqual(readFile(files[0]).indexOf("// w1 via worker options"), -1);
            assert.notEqual(readFile(files[1]).indexOf("// w2 via worker options"), -1);
        })
    );

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
