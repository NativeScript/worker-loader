import { Injectable, OnDestroy } from "@angular/core";

// add if building with webpack
import * as TsWorker from "nativescript-worker-loader!./workers/typescript.worker";

@Injectable()
export class WorkerService implements OnDestroy {
    jsWorker: null;
    tsWorker: null;
    constructor() {
    }

    ngOnDestroy() {
        if (this.jsWorker) {
            (<any>this.jsWorker).terminate();
        }
        if (this.tsWorker) {
            (<any>this.tsWorker).terminate();
        }
    }

    initTsWorker() {
        if (this.tsWorker) {
            return this.tsWorker;
        }

        // add if building with webpack
        this.tsWorker = new TsWorker();

        return this.tsWorker;
    }

    initJsWorker() {
        if (this.jsWorker) {
            return this.jsWorker;
        }

        const JsWorker = require("nativescript-worker-loader!./workers/javascript.worker.js");
        this.jsWorker = new JsWorker();

        return this.jsWorker;
    }
}
