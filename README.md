<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" hspace="25" src="https://cdn.rawgit.com/webpack/media/e7485eb2/logo/icon.svg">
  </a>
  <h1>NativeScript Worker Loader and NativeScriptWorkerPlugin</h1>
  <p>This is a fork of the official Worker Loader for Webpack.</p> 
</div>

## Install

You can install this plugin from npm:
``` bash
npm i -D nativescript-worker-loader
```

## Usage in JavaScript projects

1. Write a worker file:
``` javascript
// app/worker.js
require("globals");

global.onmessage = function(msg) {
    console.log("Inside JS worker...");
    global.postMessage("JS worker");
}
```
2. Import the worker file with the webpack loader inlined:

``` javascript
// app/main.js
const MyWorker = require("nativescript-worker-loader!./worker.js");

const worker = new MyWorker();
worker.postMessage({a: 1});
worker.onmessage = function(event) {...};
worker.addEventListener("message", function(event) {...});
```

3. Configure your webpack.config.js to use the NativeScriptWorkerPlugin.

``` javascript
// webpack.config.js
const { NativeScriptWorkerPlugin } = require("nativescript-worker-loader/NativeScriptWorkerPlugin");
// ...

module.exports = env => {
    // ...

    const config = {
        //...
        plugins: [
            new NativeScriptWorkerPlugin(),
            // ...
        ]
    }
}
```

## Usage in TypeScript projects

> **Note**: If you write your worker files in plain JS, you can configure your project by following the steps from the previous section. If you need to write them in TS, follow the steps in this section.

1. Define a custom module for your worker's exports:

``` typescript
// typings/custom.d.ts
declare module "nativescript-worker-loader!*" {
  const content: any;
  export = content;
}
```

2. Add the typings to `references.d.ts`:
``` typescript
// references.d.ts

/// <reference path="./typings/custom.d.ts" /> Workerloader
```

3. Write a worker file:

``` typescript
// app/worker.ts
import "globals";

const context: Worker = self as any;

context.onmessage = msg => {
    setTimeout(() => {
        console.log("Inside TS worker...");
        (<any>global).postMessage("TS Worker");
    }, 500)
};
```

4. Import and use the worker file in the following way:
``` typescript
// app/main.ts
import * as TsWorker from "nativescript-worker-loader!./workers/typescript.worker";

const worker = new TsWorker();
```

5. Configure your webpack.config.js to use the NativeScriptWorkerPlugin.

``` javascript
// webpack.config.js
const { NativeScriptWorkerPlugin } = require("nativescript-worker-loader/NativeScriptWorkerPlugin");
// ...

module.exports = env => {
    // ...

    const config = {
        //...
        plugins: [
            new NativeScriptWorkerPlugin(),
            // ...
        ]
    }
}
```

6. **[Angular projects only]** Install `ts-loader`:

``` bash
npm i -D ts-loader
```

7. **[Angular projects only]** Update your webpack.config.js to compile the worker files using `ts-loader` instead of the `ngtools/webpack` loader. The following code assumes that all your worker files are named in the format - ```some-name.worker.ts```. You can use a different naming convention but you have to setup the webpack loaders to also follow it.

``` javascript
// webpack.config.js

module.exports = env => {
    // ...

    const config = {
        //...
        module: {
            rules: [
                // Compile TypeScript files with ahead-of-time compiler.
                {
                    test: /.ts$/, exclude: /.worker.ts$/, use: [
                        "nativescript-dev-webpack/moduleid-compat-loader",
                        "@ngtools/webpack",
                    ]
                },

                // Compile Worker files with ts-loader
                { test: /\.worker.ts$/, loader: "ts-loader" },
            ]
        }
    }
}
```

8. **[Angular projects only]** Update your webpack.config.js to inherit the current `ngCompilerPlugin` to allow the use of shared code.

``` javascript
// webpack.config.js

module.exports = env => {
    // ...

    const config = {
        //...
        plugins: [
            new NativeScriptWorkerPlugin({
                plugins: [ngCompilerPlugin]
            }),
            // ...
        ]
    }
}
```

## Web workers with/without webpack

Please note that the way to spawn a Worker with webpack differs from the way described in the WWW Web Workers' specification (also followed by NativeScript).

Below are a few examples on how to use workers for builds with and without webpack.
#### JS worker scripts
If you wrote your worker scripts in plain JavaScript, you can require them.

Usage with webpack:
``` ts
const WorkerScript = require("nativescript-worker-loader!./worker-script.js");
const worker = new WorkerScript();
```

Usage without webpack:

``` ts
// without webpack
const worker = new Worker("./worker-script.js");
```

Or you can use the `TNS_WEBPACK` global variable to find out if your app is built with webpack or not:
``` ts
let worker: Worker;
if (global["TNS_WEBPACK"]) {
    const WorkerScript = require("nativescript-worker-loader!./worker-script.js");
    worker = new WorkerScript();
} else {
    worker = new Worker("./worker-script.js");
}
```
#### TS worker scripts
However, if you wrote your worker scripts with TypeScript, you cannot use the same code for both webpack builds and non-webpack builds.

Usage with webpack:
``` ts
import * as WorkerScript from "nativescript-worker-loader!./worker-script";
const worker = new WorkerScript();
```

Usage without webpack:
```ts
const worker = new Worker("./worker-script");

```

## Related docs

1. [Workers in NativeScript](https://docs.nativescript.org/core-concepts/multithreading-model)
2. [Webpack for NativeScript apps](https://docs.nativescript.org/best-practices/bundling-with-webpack)
