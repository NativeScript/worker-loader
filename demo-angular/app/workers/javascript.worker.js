require("globals");

global.onmessage = function(msg) {
    console.log("Inside JS worker...");
    global.postMessage("JS worker");
}
