require("tns-core-modules/globals");

global.onmessage = function (msg) {
    console.log("Inside JS worker...");
    console.log(msg);
    global.postMessage("JS worker");
}
