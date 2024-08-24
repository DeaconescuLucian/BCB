"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const utils_1 = require("../solana/utils");
const wallets_1 = require("../database/wallets");
const db_1 = require("../database/db");
var interval;
let db;
let solana;
function getWalletsData() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            (0, wallets_1.getWallets)(db, (err, rows) => __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    if (process.send) {
                        process.send({ err: err.message });
                    }
                    resolve();
                }
                else {
                    if (rows) {
                        try {
                            const newRows = yield Promise.all(rows.map((r) => __awaiter(this, void 0, void 0, function* () {
                                try {
                                    const solBalance = (yield (0, utils_1.getSolanaBalance)(solana, new web3_js_1.PublicKey(r.publicKey)));
                                    if (solBalance !== r.balance) {
                                        (0, wallets_1.updateWalletBalance)(db, { publicKey: r.publicKey, balance: solBalance });
                                    }
                                    return Object.assign(Object.assign({}, r), { balance: Math.random().toFixed(8) });
                                }
                                catch (balanceErr) {
                                    console.error('Error fetching Solana balance:', balanceErr);
                                    return Object.assign(Object.assign({}, r), { balance: 'Error' });
                                }
                            })));
                            if (process.send)
                                process.send(newRows);
                        }
                        catch (mapErr) {
                            console.error('Error processing rows:', mapErr);
                        }
                    }
                    resolve();
                }
            }));
        });
    });
}
function startWalletProcess() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            console.log('Getting wallets data from background process...');
            yield getWalletsData();
            yield new Promise((resolve) => setTimeout(resolve, 10000));
        }
    });
}
function stopWalletProcess() {
    if (interval) {
        db.close();
        clearInterval(interval);
    }
    process.exit(0);
}
process.on('message', (msg) => {
    if (msg.type === 'init') {
        db = (0, db_1.openConnection)();
        solana = (0, utils_1.createConnection)();
    }
    else if (msg === 'start') {
        startWalletProcess();
    }
    else if (msg === 'stop') {
        stopWalletProcess();
    }
});
if (process.send) {
    process.send('ready');
}
