<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" hspace="25" src="https://cdn.rawgit.com/webpack/media/e7485eb2/logo/icon.svg">
  </a>
  <h1>NativeScript Worker Loader and NativeScriptWorkerPlugin</h1>
  <p>This is a fork of the official Worker Loader for Webpack.</p> 
</div>

<h2 align="center">Install</h2>

This package is not published to npm yet! You can install it from GitHub instead:
```bash
npm i -D NativeScript/worker-loader
```

<h2 align="center"><a href="https://webpack.js.org/concepts/loaders">Usage</a></h2>

Import the worker file:

``` javascript
// main.js
var MyWorker = require("worker-loader!./file.js");

var worker = new MyWorker();
worker.postMessage({a: 1});
worker.onmessage = function(event) {...};
worker.addEventListener("message", function(event) {...});
```

Inline mode for workers is not supported!

This package is shipped with NativeScriptWorkerPlugin. It will output a `__worker-chunks.json` to the build directory on every build. The file is required for internal use. You need to register the NativeScriptWorkerPlugin in your Webpack configuration:
``` javascript
// webpack.config.js
const { NativeScriptWorkerPlugin } = require("worker-loader/NativeScriptWorkerPlugin");
// ...

function getPlugins(platform, env) {
    let plugins = [
        new NativeScriptWorkerPlugin(),
        // ...
    ]
}
```

To set a custom name for the output script, use the `name` parameter. The name may contain the string `[hash]`,
which will be replaced with a content-dependent hash for caching purposes. For example:

``` javascript
var MyWorker = require("worker-loader?name=outputWorkerName.[hash].js!./myWorker.js");
```

The worker file can import dependencies just like any other file:

``` javascript
// file.js
var _ = require('lodash')

var o = {foo: 'foo'}

_.has(o, 'foo') // true

// Post data to parent thread
self.postMessage({foo: 'foo'}) 

// Respond to message from parent thread
self.addEventListener('message', function(event){ console.log(event); });  
```

You can even use ES6 modules if you have the babel-loader configured:

``` javascript
// file.js
import _ from 'lodash'

let o = {foo: 'foo'}

_.has(o, 'foo') // true

// Post data to parent thread
self.postMessage({foo: 'foo'}) 

// Respond to message from parent thread
self.addEventListener('message', (event) => { console.log(event); });
```

### Demo apps
For usage with NativeScript Angular, check out the `demo-angular` app in this repo.

For usage with NativeScript apps written in plain JavaScript, check out this repo: https://github.com/NativeScript/demo-workers.

### Integrating with TypeScript

To integrate with TypeScript, you will need to define a custom module for the exports of your worker. You will also need to cast the new worker as the `Worker` type:

**typings/custom.d.ts**
```
declare module "worker-loader!*" {
  const content: any;
  export = content;
}
```

**App.ts**
```
import * as MyWorker from "worker-loader!../../worker";
const worker: Worker = new MyWorker();
```

### Web workers with/without webpack

Please note that the way to spawn a Worker with webpack differs from the way described in the WWW Web Workers' specification (also followed by NativeScript).

Below are a few examples on how to use workers for builds with and without webpack.
#### JS worker scripts
If you wrote your worker scripts in plain JavaScript, you can require them.

Usage with webpack:
``` ts
const WorkerScript = require("worker-loader!./worker-script.js");
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
if (global.["TNS_WEBPACK"]) {
    const WorkerScript = require("worker-loader!./worker-script.js");
    worker = new WorkerScript();
} else {
    worker = new Worker("./worker-script.js");
}
```
#### TS worker scripts
However, if you wrote your worker scripts with TypeScript, you cannot use the same code for both webpack builds and non-webpack builds.

Usage with webpack:
``` ts
import * as WorkerScript from "worker-loader!./worker-script";
const worker = new WorkerScript();
```

Usage without webpack:
```ts
const worker = new Worker("./worker-script");

```
