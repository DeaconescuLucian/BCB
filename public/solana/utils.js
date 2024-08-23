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
exports.TransferFeesDefault = void 0;
exports.createConnection = createConnection;
exports.getSolanaBalance = getSolanaBalance;
exports.createSignedTransaction = createSignedTransaction;
exports.simpleTransfer = simpleTransfer;
const web3_js_1 = require("@solana/web3.js");
exports.TransferFeesDefault = {
    prioFee: 1000,
    cpuLimit: 1000
};
function createConnection() {
    return new web3_js_1.Connection('https://api.devnet.solana.com');
}
function getSolanaBalance(connection, publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return ((yield connection.getBalance(publicKey)) / web3_js_1.LAMPORTS_PER_SOL);
    });
}
function createSignedTransaction(wallet, connection, instructions, signers, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!blockhash) {
            blockhash = (yield connection.getLatestBlockhash('finalized')).blockhash;
        }
        let payerKey;
        if (signers && !signers.some(signer => signer.publicKey.equals(wallet.publicKey))) {
            payerKey = signers[0].publicKey;
        }
        else {
            payerKey = wallet.publicKey;
        }
        const tx_msg = new web3_js_1.TransactionMessage({
            payerKey: payerKey,
            instructions: instructions,
            recentBlockhash: blockhash
        }).compileToV0Message();
        const tx = new web3_js_1.VersionedTransaction(tx_msg);
        let fsigners = signers || [wallet];
        tx.sign(fsigners);
        return tx;
    });
}
function simpleTransfer(connection, TransferParams) {
    return __awaiter(this, void 0, void 0, function* () {
        let { walletA, walletB, amount, cpuLimit, prioFee } = TransferParams;
        const [lastbk, accountBalance, rent] = yield Promise.all([
            connection.getLatestBlockhash('finalized').then(res => res.blockhash),
            connection.getBalance(walletA.publicKey, 'confirmed'),
            connection.getMinimumBalanceForRentExemption(0)
        ]);
        if (!prioFee) {
            prioFee = exports.TransferFeesDefault.prioFee;
        }
        if (!cpuLimit) {
            cpuLimit = exports.TransferFeesDefault.cpuLimit;
        }
        if (amount > accountBalance) {
            console.log('Insufficient funds');
            return;
        }
        const toPubkey = walletB instanceof web3_js_1.PublicKey ? walletB : walletB.publicKey;
        let instructions = [
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: cpuLimit }),
            web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: prioFee }),
            web3_js_1.SystemProgram.transfer({
                fromPubkey: walletA.publicKey,
                toPubkey: toPubkey,
                lamports: amount
            }),
        ];
        const tx = yield createSignedTransaction(walletA, connection, instructions, undefined, lastbk);
        const sim = yield connection.simulateTransaction(tx, { commitment: 'confirmed' });
        if (sim.value.err) {
            console.log(sim.value.logs);
            console.log(sim.value.err);
            return;
        }
        console.log(`Simulation successful`);
        return;
    });
}
