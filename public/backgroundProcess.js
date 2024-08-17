"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WalletHandler_1 = require("./handlers/WalletHandler");
let interval;
function startBackgroundProcess() {
    console.log('Background process started');
    interval = setInterval(() => {
        const message = `Background update at ${new Date().toLocaleTimeString()}`;
        console.log('Sending message:', message);
        if (process.send) {
            process.send(message);
        }
    }, 5000);
}
function stopBackgroundProcess() {
    console.log('Stopping background process');
    if (interval) {
        clearInterval(interval);
    }
    process.exit(0);
}
process.on('message', (msg) => {
    console.log('Received message in background process:', msg);
    if (msg === 'start') {
        startBackgroundProcess();
    }
    else if (msg === 'stop') {
        stopBackgroundProcess();
    }
});
console.log('Background process file loaded');
if (process.send) {
    process.send('ready');
}
(0, WalletHandler_1.WatchWalletHandler)(null);
