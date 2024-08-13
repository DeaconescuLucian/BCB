"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importKeypair = exports.generateWallet = void 0;
const web3_js_1 = require("@solana/web3.js");
const bs58 = __importStar(require("bs58"));
const generateWallet = () => {
    const keyPair = web3_js_1.Keypair.generate();
    return { kp: keyPair, pub: keyPair.publicKey.toBase58(), secret: keyPair.secretKey };
};
exports.generateWallet = generateWallet;
function importKeypair(param) {
    let keyPair, secretKey;
    try {
        secretKey = Uint8Array.from(param.split(',').map(Number));
        keyPair = web3_js_1.Keypair.fromSecretKey(secretKey);
    }
    catch (_a) {
        try {
            secretKey = bs58.decode(param);
            keyPair = web3_js_1.Keypair.fromSecretKey(secretKey);
        }
        catch (_b) {
            console.error('Invalid keypair');
            return;
        }
    }
    return { kp: keyPair, pub: keyPair.publicKey.toBase58(), secret: keyPair.secretKey };
}
exports.importKeypair = importKeypair;
