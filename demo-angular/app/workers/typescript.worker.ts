import "globals";

const context: Worker = self as any;

context.onmessage = msg => {
    setTimeout(() => {
        console.log("Inside TS worker...");
        (<any>global).postMessage("TS Worker");
    }, 500)
};
