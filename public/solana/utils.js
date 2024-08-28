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
exports.getTokensOwnedByWallet = getTokensOwnedByWallet;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const js_1 = require("@metaplex/js");
const { TokenListProvider, TokenInfo } = require('@solana/spl-token-registry');
exports.TransferFeesDefault = {
    prioFee: 1000,
    cpuLimit: 1000,
};
function createConnection() {
    //return new Connection(clusterApiUrl("devnet"), "confirmed");
    return new web3_js_1.Connection('https://solana-mainnet.api.syndica.io/api-key/aS1Y8g8LYE1fxcFBtrG6v5GfsTZNhpBnoLF3YVXwESwmRu1RkAxm32ctxkVGNRkxLF78T7PWaDn5y4UGTvXDWNShHatT92pTzK');
}
function getSolanaBalance(connection, publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield connection.getBalance(publicKey)) / web3_js_1.LAMPORTS_PER_SOL;
    });
}
function createSignedTransaction(wallet, connection, instructions, signers, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!blockhash) {
            blockhash = (yield connection.getLatestBlockhash('finalized')).blockhash;
        }
        let payerKey;
        if (signers && !signers.some((signer) => signer.publicKey.equals(wallet.publicKey))) {
            payerKey = signers[0].publicKey;
        }
        else {
            payerKey = wallet.publicKey;
        }
        const tx_msg = new web3_js_1.TransactionMessage({
            payerKey: payerKey,
            instructions: instructions,
            recentBlockhash: blockhash,
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
            connection.getLatestBlockhash('finalized').then((res) => res.blockhash),
            connection.getBalance(walletA.publicKey, 'confirmed'),
            connection.getMinimumBalanceForRentExemption(0),
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
                lamports: amount,
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
function getTokensOwnedByWallet(connection, publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const { metadata: { Metadata }, } = js_1.programs;
        const tokensAccs = yield connection.getTokenAccountsByOwner(publicKey, { programId: spl_token_1.TOKEN_PROGRAM_ID });
        let name, symbol, mint, accAddress, balance, amount, decimals, isNft;
        let tokens = [];
        let accounts = [];
        for (const tokenAcc of tokensAccs.value) {
            const accData = raydium_sdk_1.SPL_ACCOUNT_LAYOUT.decode(tokenAcc.account.data);
            if (!accData.amount.isZero()) {
                mint = accData.mint;
                accAddress = tokenAcc.pubkey.toBase58();
                try {
                    const metadataPDA = yield Metadata.getPDA(accData.mint);
                    const metadataAccount = yield Metadata.load(connection, metadataPDA);
                    balance = (yield connection.getTokenAccountBalance(tokenAcc.pubkey)).value;
                    amount = balance.uiAmount;
                    decimals = balance.decimals;
                    name = metadataAccount.data.data.name;
                    symbol = metadataAccount.data.data.symbol;
                    isNft = decimals === 0;
                    tokens.push({
                        mint: mint.toString(),
                        name: name,
                        symbol: symbol,
                        decimals: decimals,
                        isNft: isNft,
                    });
                    accounts.push({
                        publicKey: publicKey.toBase58(),
                        accountAddress: accAddress,
                        mint: mint.toString(),
                        amount: amount,
                    });
                }
                catch (err) {
                    continue;
                }
            }
        }
        return new Promise((resolve) => {
            resolve({
                tokens: tokens,
                accounts: accounts,
            });
        });
    });
}
//LOAD SPL TOKENS
// const provider = new TokenListProvider();
// provider.resolve().then((tokens: any) => {
//   const tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
//   console.log(tokenList.length)
// });
