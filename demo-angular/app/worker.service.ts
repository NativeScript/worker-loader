import { Injectable } from "@angular/core";

@Injectable()
export class WorkerService {
    constructor() {
    }

    initTsWorker() {
        // add if building with webpack
        let w: any;

        if ((<any>global).TNS_WEBPACK) {
            var TsWorkerr = require("nativescript-worker-loader!./workers/typescript.worker.js");
            w = new TsWorkerr();
        } else {
            w = new Worker("./workers/typescript.worker.js");
        }

        return w;
    } 

    initJsWorker() {
        let worker: Worker;

        if ((<any>global).TNS_WEBPACK) {
            const JsWorker = require("nativescript-worker-loader!./workers/javascript.worker.js");
            worker = new JsWorker();
        } else {
            worker = new Worker("./workers/javascript.worker.js");
        }

        return worker;
    }
}
