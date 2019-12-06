const workers = [];

export class WorkerService {
    constructor() {
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

if ((module).hot) {
    (module).hot.dispose(() => {
        workers.forEach(w => {
            w.terminate();
        })
    })
}