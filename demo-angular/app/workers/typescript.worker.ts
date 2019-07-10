import "tns-core-modules/globals";
import { sharedFunction } from "../shared";

const context: Worker = self as any;

context.onmessage = msg => {
    sharedFunction("worker");
    setTimeout(() => {
        console.log("Inside TS worker...");
        console.log(msg);
        (<any>global).postMessage("TS Worker");
    }, 500)
};
