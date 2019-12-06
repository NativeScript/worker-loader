import { Observable } from "tns-core-modules/data/observable";
import { WorkerService } from "./worker.service";
import { sharedFunction } from "./shared";

export class HelloWorldModel extends Observable {
    private tsWorker: Worker;
    private jsWorker: Worker;
    private workerService: WorkerService;

    private _counter: number;
    private _message: string;

    constructor() {
        super();

        // Initialize default values.
        this._counter = 42;
        this.updateMessage();

        sharedFunction("app");
        this.workerService = new WorkerService();
        this.tsWorker = this.workerService.initTsWorker();
        this.jsWorker = this.workerService.initJsWorker();

        this.tsWorker.onmessage = m => console.log(m);
        this.jsWorker.onmessage = m => console.log(m);

        this.tsWorker.postMessage("Ts worker loader executed!");
        this.jsWorker.postMessage("Js worker loader executed!");
    }

    get message(): string {
        return this._message;
    }

    set message(value: string) {
        if (this._message !== value) {
            this._message = value;
            this.notifyPropertyChange("message", value);
        }
    }

    onTap() {
        this._counter--;
        this.updateMessage();
    }

    private updateMessage() {
        if (this._counter <= 0) {
            this.message = "Hoorraaay! You unlocked the NativeScript clicker achievement!";
        } else {
            this.message = `${this._counter} taps left`;
        }
    }
}
