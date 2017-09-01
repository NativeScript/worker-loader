require("globals");

(<any>global).onmessage = msg => {
    setTimeout(() => {
        console.log("Inside TS worker...");
        (<any>global).postMessage("TS Worker");
    }, 500);
};
