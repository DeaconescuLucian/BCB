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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmTransaction = confirmTransaction;
exports.simpleTransfer = simpleTransfer;
exports.getPoolKeys = getPoolKeys;
exports.buy = buy;
exports.unwrapSol = unwrapSol;
exports.wrapSol = wrapSol;
exports.sell = sell;
const web3_js_1 = require("@solana/web3.js");
const raydium = __importStar(require("@raydium-io/raydium-sdk"));
const spl_token_1 = require("@solana/spl-token");
const bn_js_1 = __importDefault(require("bn.js"));
const utils_1 = require("./utils");
function simulateTransaction(tx, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const sim = yield connection.simulateTransaction(tx, { commitment: 'confirmed' });
        if (sim.value.err) {
            console.log(sim.value.logs);
            console.log(sim.value.err);
            return {
                status: 'fail',
                error: 'Simulation failed',
            };
        }
        else {
            console.log(`Simulation successful`);
            return {
                status: 'success',
                message: 'Simulation successful',
            };
        }
    });
}
function confirmTransaction(connection, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { signature, block } = params;
        try {
            const result = yield connection.confirmTransaction({ signature: signature, blockhash: block.blockhash, lastValidBlockHeight: block.lastValidBlockHeight }, 'confirmed');
            if (result) {
                if (result.value.err) {
                    console.log(`Error confirming signature: ${signature}`);
                    console.log(result.value.err);
                    return {
                        status: 'fail',
                        error: 'Transaction was not confirmed',
                        signature: signature,
                        date: new Date()
                    };
                }
                else {
                    console.log(`Signature confirmed: ${signature}`);
                    return {
                        status: 'success',
                        message: 'Transaction confirmed',
                        signature: signature,
                        date: new Date()
                    };
                }
            }
            else {
                return {
                    status: 'fail',
                    error: 'Transaction was not confirmed',
                    signature: signature,
                    date: new Date()
                };
            }
        }
        catch (_a) {
            return {
                status: 'fail',
                error: 'Transaction was not confirmed',
                signature: signature,
                date: new Date()
            };
        }
    });
}
function sendTransaction(tx, block, connection, simulate, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (simulate)
                return simulateTransaction(tx, connection);
            else {
                const signature = yield connection.sendRawTransaction(tx.serialize(), { skipPreflight: true });
                console.log(`Transaction sent: ${signature}`);
                if (signature) {
                    return {
                        status: 'success',
                        message: `Transaction sent: ${signature}`,
                        signature: signature,
                        block: block,
                        amount: amount
                    };
                }
                else {
                    return {
                        status: 'fail',
                        message: `Transaction could not be sent.`,
                    };
                }
            }
        }
        catch (e) {
            console.log(`Error sending transaction`);
            console.log(e);
            return {
                status: 'fail',
                error: 'Transaction could not be sent.',
            };
        }
    });
}
function createSignedTransaction(instructions, connection, signer, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!blockhash) {
            blockhash = (yield connection.getLatestBlockhash('finalized')).blockhash;
        }
        const tx_msg = new web3_js_1.TransactionMessage({
            payerKey: signer.publicKey,
            instructions: instructions,
            recentBlockhash: blockhash,
        }).compileToV0Message();
        const tx = new web3_js_1.VersionedTransaction(tx_msg);
        tx.sign([signer]);
        return tx;
    });
}
function simpleTransfer(params, fees, connection, simulate) {
    return __awaiter(this, void 0, void 0, function* () {
        let { walletA, walletB, amount } = params;
        amount = amount * web3_js_1.LAMPORTS_PER_SOL;
        const [lastbk, accountBalance, rent] = yield Promise.all([
            connection.getLatestBlockhash('finalized'),
            connection.getBalance(walletA.publicKey, 'confirmed'),
            connection.getMinimumBalanceForRentExemption(0),
        ]);
        const toPubkey = walletB instanceof web3_js_1.PublicKey ? walletB : walletB.publicKey;
        let instructions = [
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
            web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: fees.prioFee * web3_js_1.LAMPORTS_PER_SOL }),
            web3_js_1.SystemProgram.transfer({
                fromPubkey: walletA.publicKey,
                toPubkey: toPubkey,
                lamports: amount,
            }),
        ];
        const tx = yield createSignedTransaction(instructions, connection, walletA, lastbk.blockhash);
        return sendTransaction(tx, lastbk, connection, simulate);
    });
}
function getPoolKeys(mint, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const quoteToken = raydium.Token.WSOL.mint;
        let poolKeys = yield (0, utils_1.findRaydiumPoolInfo)(mint.toString(), quoteToken.toString(), connection);
        if (!poolKeys) {
            return undefined;
        }
        return poolKeys;
    });
}
function buy(params, fees, connection, simulate) {
    return __awaiter(this, void 0, void 0, function* () {
        let { wallet, mint, amount, poolKeys } = params;
        if (!poolKeys) {
            console.log(`Pool not found`);
            return {
                status: 'fail',
                error: 'Pool not found',
            };
        }
        const quoteToken = raydium.Token.WSOL.mint;
        const tokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, wallet.publicKey, true);
        const quotetokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(quoteToken, wallet.publicKey, true);
        const quoteAmount = new bn_js_1.default(amount * web3_js_1.LAMPORTS_PER_SOL);
        const { innerTransaction, address } = raydium.Liquidity.makeSwapFixedInInstruction({
            poolKeys: poolKeys,
            userKeys: {
                tokenAccountIn: quotetokenAccount,
                tokenAccountOut: tokenAccount,
                owner: wallet.publicKey,
            },
            amountIn: quoteAmount,
            minAmountOut: 0,
        }, poolKeys.version);
        const lastbk = yield connection.getLatestBlockhash('finalized');
        const instructions = [
            web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee * web3_js_1.LAMPORTS_PER_SOL }),
            (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(wallet.publicKey, tokenAccount, wallet.publicKey, mint),
            ...innerTransaction.instructions,
        ];
        const tx = yield createSignedTransaction(instructions, connection, wallet, lastbk.blockhash);
        return sendTransaction(tx, lastbk, connection, simulate, params.amount);
    });
}
function unwrapSol(wallet, connection, amount, simulate) {
    return __awaiter(this, void 0, void 0, function* () {
        const ata = (0, spl_token_1.getAssociatedTokenAddressSync)(raydium.Token.WSOL.mint, wallet.publicKey);
        const blockhash = yield connection.getLatestBlockhash('finalized');
        const instructions = [
            web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }),
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
            (0, spl_token_1.createCloseAccountInstruction)(ata, wallet.publicKey, wallet.publicKey),
        ];
        const tx = yield createSignedTransaction(instructions, connection, wallet);
        return sendTransaction(tx, blockhash, connection, simulate, amount);
    });
}
function wrapSol(wallet, amount, connection, simulate) {
    return __awaiter(this, void 0, void 0, function* () {
        const ata = (0, spl_token_1.getAssociatedTokenAddressSync)(raydium.Token.WSOL.mint, wallet.publicKey);
        const blockhash = yield connection.getLatestBlockhash('finalized');
        const instructions = [
            web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 50000 }),
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
            (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(wallet.publicKey, ata, wallet.publicKey, raydium.Token.WSOL.mint),
            web3_js_1.SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: ata,
                lamports: BigInt(amount * web3_js_1.LAMPORTS_PER_SOL),
            }),
            (0, spl_token_1.createSyncNativeInstruction)(ata),
        ];
        const tx = yield createSignedTransaction(instructions, connection, wallet);
        return sendTransaction(tx, blockhash, connection, simulate, amount);
    });
}
function sell(params, fees, connection, simulate) {
    return __awaiter(this, void 0, void 0, function* () {
        const quoteToken = raydium.Token.WSOL.mint;
        const { wallet, mint, percentage } = params;
        const poolKeys = params.poolKeys || (yield (0, utils_1.findRaydiumPoolInfo)(mint.toString(), quoteToken.toString(), connection));
        if (!poolKeys) {
            console.log(`Pool not found`);
            return {
                status: 'fail',
                error: 'Pool not found',
            };
        }
        const tokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(mint, wallet.publicKey);
        const quotetokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(quoteToken, wallet.publicKey);
        let s;
        try {
            s = yield connection.getTokenAccountBalance(tokenAccount, 'confirmed');
        }
        catch (_a) {
            console.log('Token account does not exist');
            return {
                status: 'fail',
                error: 'Token account does not exist',
            };
        }
        let initialsupply = new bn_js_1.default(s.value.amount);
        let amount = initialsupply.mul(new bn_js_1.default(percentage)).div(new bn_js_1.default(100));
        const { innerTransaction, address } = raydium.Liquidity.makeSwapFixedInInstruction({
            poolKeys: poolKeys,
            userKeys: {
                tokenAccountIn: tokenAccount,
                tokenAccountOut: quotetokenAccount,
                owner: wallet.publicKey,
            },
            amountIn: amount,
            minAmountOut: 0,
        }, poolKeys.version);
        let lastbk = (yield connection.getLatestBlockhash('finalized')).blockhash;
        const instructions = [
            web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 }),
            web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: fees.prioFee * web3_js_1.LAMPORTS_PER_SOL }),
            (0, spl_token_1.createAssociatedTokenAccountIdempotentInstruction)(wallet.publicKey, quotetokenAccount, wallet.publicKey, quoteToken),
            ...innerTransaction.instructions,
        ];
        const sell_tx = yield createSignedTransaction(instructions, connection, wallet, lastbk);
        return sendTransaction(sell_tx, lastbk, connection, simulate);
    });
}
