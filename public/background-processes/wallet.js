"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_1 = require("../solana/wallet");
var interval;
function startWalletProcess() {
    interval = setInterval(() => {
        const message = (0, wallet_1.generateWallet)().publicKey;
        if (process.send) {
            process.send(message);
        }
    }, 1000);
}
function stopWalletProcess() {
    if (interval) {
        clearInterval(interval);
    }
    process.exit(0);
}
process.on('message', (msg) => {
    if (msg === 'start') {
        startWalletProcess();
    }
    else if (msg === 'stop') {
        stopWalletProcess();
    }
});
if (process.send) {
    process.send('ready');
}
