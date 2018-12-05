import { Component, OnInit } from "@angular/core";

import { WorkerService } from "./worker.service";

@Component({ template: `` })
export class AppComponent implements OnInit {
    private tsWorker: Worker;
    private jsWorker: Worker;

    constructor(private workerService: WorkerService) { }

    ngOnInit() {
        this.tsWorker = this.workerService.initTsWorker();
        this.jsWorker = this.workerService.initJsWorker();

        this.tsWorker.postMessage("Ts worker loader executed!");
        this.jsWorker.postMessage("Js worker loader executed!");

        this.tsWorker.onmessage = m => this.logWorkerMessage(m);
        this.jsWorker.onmessage = m => this.logWorkerMessage(m);
    }

    private logWorkerMessage(message: MessageEvent) {
        console.log(message.data);
    }
}
