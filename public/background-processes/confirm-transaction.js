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
const utils_1 = require("../solana/utils");
const transactions_1 = require("../solana/transactions");
let data;
let connection;
function startConfirmTransactionProcess(data) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(data);
        console.log('Confirm transaction started');
        connection = (0, utils_1.createConnection)(data.connection);
        const response = yield (0, transactions_1.confirmTransaction)(connection, {
            block: data.transactionData.block,
            signature: data.transactionData.signature,
        });
        if (response)
            if (process.send) {
                process.send({
                    type: 'transaction-confirmation-done',
                    data: {
                        signature: response.signature,
                        status: response.status,
                        date: response.date,
                        value: data.transactionData.amount,
                    },
                });
            }
        stopTransactionProcess();
    });
}
function stopTransactionProcess() {
    console.log('Stopped confirm transaction');
    process.exit(0);
}
process.on('message', (msg) => {
    if (msg.type === 'start') {
        startConfirmTransactionProcess(msg.data);
    }
});
console.log('Sending ready message from conifrm-transaction process');
if (process.send) {
    process.send('ready');
}
