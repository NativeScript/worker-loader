import "globals";

const context: Worker = self as any;

context.onmessage = msg => {
    setTimeout(() => {
        console.log("Inside TS worker...");
        console.log(msg);
        (<any>global).postMessage("TS Worker");
    }, 500)
};
