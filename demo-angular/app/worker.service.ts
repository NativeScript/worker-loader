import { Injectable } from "@angular/core";

@Injectable()
export class WorkerService {
    constructor() {
    }

    initTsWorker() {
        // add if building with webpack
        let worker: any;

        if ((<any>global).TNS_WEBPACK) {
            var TsWorker = require("nativescript-worker-loader!./workers/typescript.worker.js");
            worker = new TsWorker();
        } else {
            worker = new Worker("./workers/typescript.worker.js");
        }

        return worker;
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
