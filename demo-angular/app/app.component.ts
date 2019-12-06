import { Component, OnInit } from "@angular/core";

import { WorkerService } from "./worker.service";
import { sharedFunction } from "./shared";

@Component({
    template: `
<StackLayout class="p-20">
    <Label text="Angular Worker Demo" class="h1"></Label>
    <Label text="Check console output" class="font-italic"></Label>
<StackLayout>
` })
export class AppComponent implements OnInit {
    private tsWorker: Worker;
    private jsWorker: Worker;

    constructor(private workerService: WorkerService) { }

    ngOnInit() {
        sharedFunction("app");
        this.tsWorker = this.workerService.initTsWorker();
        this.jsWorker = this.workerService.initJsWorker();

        this.tsWorker.onmessage = m => this.logWorkerMessage(m);
        this.jsWorker.onmessage = m => this.logWorkerMessage(m);

        this.tsWorker.postMessage("Ts worker loader executed!");
        this.jsWorker.postMessage("Js worker loader executed!");
    }

    private logWorkerMessage(message: MessageEvent) {
        console.log(message.data);
    }
}
