// add if building with webpack
import * as TsWorker from "nativescript-worker-loader!./workers/typescript.worker";
const workers = [];

export class WorkerService {
    jsWorker: null;
    tsWorker: null;
    constructor() {
    }

    initTsWorker() {
        if (this.tsWorker) {
            return this.tsWorker;
        }

        // add if building with webpack
        this.tsWorker = new TsWorker();
        workers.push(this.tsWorker);

        return this.tsWorker;
    }

    initJsWorker() {
        if (this.jsWorker) {
            return this.jsWorker;
        }

        const JsWorker = require("nativescript-worker-loader!./workers/javascript.worker.js");
        this.jsWorker = new JsWorker();
        workers.push(this.jsWorker);

        return this.jsWorker;
    }
}

if ((<any>module).hot) {
    (<any>module).hot.dispose(() => {
        workers.forEach(w => {
            w.terminate();
        })
    })
}