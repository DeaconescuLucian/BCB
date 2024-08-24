"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWallet = void 0;
exports.importKeypair = importKeypair;
const web3_js_1 = require("@solana/web3.js");
const generateWallet = () => {
    const keyPair = web3_js_1.Keypair.generate();
    return { publicKey: keyPair.publicKey.toBase58(), secretKey: keyPair.secretKey };
};
exports.generateWallet = generateWallet;
function importKeypair(param) {
    let keyPair, secretKey;
    try {
        secretKey = Uint8Array.from(param.split(',').map(Number));
        keyPair = web3_js_1.Keypair.fromSecretKey(secretKey);
        return {
            status: 'success',
            message: 'Wallet imported successfully.',
            data: { keyPair: keyPair, publicKey: keyPair.publicKey.toBase58(), secretKey: param },
        };
    }
    catch (_a) {
        return { status: 'fail', message: 'Invalid secret key.' };
    }
}
