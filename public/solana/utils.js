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
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRaydiumPoolInfo = findRaydiumPoolInfo;
exports.createConnection = createConnection;
exports.getSolanaBalance = getSolanaBalance;
exports.getTokensOwnedByWallet = getTokensOwnedByWallet;
exports.getTokenDetails = getTokenDetails;
exports.getTokenPrice = getTokenPrice;
exports.getTokensPrice = getTokensPrice;
exports.getTokenList = getTokenList;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const raydium = __importStar(require("@raydium-io/raydium-sdk"));
const js_1 = require("@metaplex/js");
const { TokenListProvider } = require('@solana/spl-token-registry');
function findRaydiumPoolInfo(baseMint, quoteMint, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const layout = raydium.LIQUIDITY_STATE_LAYOUT_V4;
        const programData = yield connection.getProgramAccounts(raydium.MAINNET_PROGRAM_ID.AmmV4, {
            filters: [
                { dataSize: layout.span },
                {
                    memcmp: {
                        offset: layout.offsetOf('baseMint'),
                        bytes: new web3_js_1.PublicKey(baseMint).toBase58(),
                    },
                },
                {
                    memcmp: {
                        offset: layout.offsetOf('quoteMint'),
                        bytes: new web3_js_1.PublicKey(quoteMint).toBase58(),
                    },
                },
            ],
        });
        const collectedPoolResults = programData
            .map((info) => (Object.assign({ id: new web3_js_1.PublicKey(info.pubkey), version: 4, programId: raydium.MAINNET_PROGRAM_ID.AmmV4 }, layout.decode(info.account.data))))
            .flat();
        const pool = collectedPoolResults[0];
        if (!pool) {
            console.log('Pool not found');
            return undefined;
        }
        const market = yield connection.getAccountInfo(pool.marketId).then((item) => (Object.assign({ programId: item.owner }, raydium.MARKET_STATE_LAYOUT_V3.decode(item.data))));
        const authority = raydium.Liquidity.getAssociatedAuthority({
            programId: raydium.MAINNET_PROGRAM_ID.AmmV4,
        }).publicKey;
        const marketProgramId = market.programId;
        const poolKeys = {
            id: pool.id,
            baseMint: pool.baseMint,
            quoteMint: pool.quoteMint,
            lpMint: pool.lpMint,
            baseDecimals: Number.parseInt(pool.baseDecimal.toString()),
            quoteDecimals: Number.parseInt(pool.quoteDecimal.toString()),
            lpDecimals: Number.parseInt(pool.baseDecimal.toString()),
            version: pool.version,
            programId: pool.programId,
            openOrders: pool.openOrders,
            targetOrders: pool.targetOrders,
            baseVault: pool.baseVault,
            quoteVault: pool.quoteVault,
            marketVersion: 3,
            authority: authority,
            marketProgramId,
            marketId: market.ownAddress,
            marketAuthority: raydium.Market.getAssociatedAuthority({
                programId: marketProgramId,
                marketId: market.ownAddress,
            }).publicKey,
            marketBaseVault: market.baseVault,
            marketQuoteVault: market.quoteVault,
            marketBids: market.bids,
            marketAsks: market.asks,
            marketEventQueue: market.eventQueue,
            withdrawQueue: pool.withdrawQueue,
            lpVault: pool.lpVault,
            lookupTableAccount: web3_js_1.PublicKey.default,
        };
        return poolKeys;
    });
}
function createConnection(connection) {
    if (connection.startsWith('http'))
        return new web3_js_1.Connection(connection);
    else
        return new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)(connection), 'confirmed');
}
function getSolanaBalance(connection, publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield connection.getBalance(publicKey)) / web3_js_1.LAMPORTS_PER_SOL;
    });
}
function fetchData(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(uri);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = yield response.json();
            return data;
        }
        catch (error) {
            console.log('There was a problem with the fetch operation:');
            return null;
        }
    });
}
function getTokensOwnedByWallet(connection, publicKey, existingMints) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { metadata: { Metadata }, } = js_1.programs;
        const tokensAccs = yield connection.getTokenAccountsByOwner(publicKey, { programId: spl_token_1.TOKEN_PROGRAM_ID });
        let name, symbol, mint, accAddress, balance, amount, decimals, isNft, icon, uri;
        let tokens = [];
        let accounts = [];
        //LOAD SPL TOKENS
        let tokenList = [];
        const provider = new TokenListProvider();
        provider.resolve().then((tokens) => {
            tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
        });
        for (const tokenAcc of tokensAccs.value) {
            const accData = raydium.SPL_ACCOUNT_LAYOUT.decode(tokenAcc.account.data);
            if (!accData.amount.isZero()) {
                mint = accData.mint.toString();
                icon =
                    ((_a = tokenList === null || tokenList === void 0 ? void 0 : tokenList.find((e) => e.address === mint)) === null || _a === void 0 ? void 0 : _a.logoURI) ||
                        ((_b = existingMints === null || existingMints === void 0 ? void 0 : existingMints.find((e) => e.mint === mint)) === null || _b === void 0 ? void 0 : _b.icon) ||
                        null;
                accAddress = tokenAcc.pubkey.toBase58();
                balance = (yield connection.getTokenAccountBalance(tokenAcc.pubkey)).value;
                amount = balance.uiAmount;
                decimals = balance.decimals;
                isNft = decimals === 0;
                try {
                    if (!(existingMints === null || existingMints === void 0 ? void 0 : existingMints.find((e) => e.mint === mint))) {
                        const metadataPDA = yield Metadata.getPDA(accData.mint);
                        const metadataAccount = yield Metadata.load(connection, metadataPDA);
                        name = metadataAccount.data.data.name;
                        symbol = metadataAccount.data.data.symbol;
                        uri = metadataAccount.data.data.uri;
                        if (uri && !isNft && !icon) {
                            let response = yield fetchData(uri);
                            if (response) {
                                if (response.image) {
                                    icon = response.image;
                                }
                            }
                        }
                        tokens.push({
                            mint: mint,
                            name: name,
                            symbol: symbol,
                            decimals: decimals,
                            isNft: isNft,
                            icon: icon,
                        });
                    }
                    accounts.push({
                        publicKey: publicKey.toBase58(),
                        accountAddress: accAddress,
                        mint: mint,
                        amount: amount,
                    });
                }
                catch (err) {
                    accounts.push({
                        publicKey: publicKey.toBase58(),
                        accountAddress: accAddress,
                        mint: mint,
                        amount: amount,
                    });
                    tokens.push({
                        mint: mint,
                        name: null,
                        symbol: null,
                        decimals: decimals,
                        isNft: isNft,
                        icon: icon,
                    });
                    continue;
                }
            }
        }
        existingMints === null || existingMints === void 0 ? void 0 : existingMints.forEach((m) => {
            if (!accounts.find((a) => a.mint === m.mint)) {
                accounts.push({
                    publicKey: publicKey.toBase58(),
                    mint: m.mint,
                    toDelete: true,
                });
            }
        });
        return new Promise((resolve) => {
            resolve({
                tokens: tokens,
                accounts: accounts,
            });
        });
    });
}
function getTokenDetails(connection, mint) {
    return __awaiter(this, void 0, void 0, function* () {
        const { metadata: { Metadata }, } = js_1.programs;
        try {
            let tokenList = [];
            let icon;
            const provider = new TokenListProvider();
            yield provider.resolve().then((tokens) => {
                var _a;
                tokenList = tokens.filterByClusterSlug('mainnet-beta').getList();
                icon = ((_a = tokenList === null || tokenList === void 0 ? void 0 : tokenList.find((e) => e.address === mint)) === null || _a === void 0 ? void 0 : _a.logoURI) || null;
            });
            const metadataPDA = yield Metadata.getPDA(mint);
            const metadataAccount = yield Metadata.load(connection, metadataPDA);
            let name = metadataAccount.data.data.name;
            let symbol = metadataAccount.data.data.symbol;
            let uri = metadataAccount.data.data.uri;
            let price = yield getTokenPrice(mint);
            if (uri) {
                let response = yield fetchData(uri);
                if (response) {
                    if (response.image) {
                        icon = response.image;
                    }
                }
            }
            return {
                mint: mint,
                name,
                symbol,
                icon,
                price,
            };
        }
        catch (error) {
            let price = yield getTokenPrice(mint);
            return {
                mint: mint,
                price: price,
            };
        }
    });
}
function getTokenPrice(mint) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetchData(`https://api-v3.raydium.io/mint/price?mints=${mint}`);
            return response.data[mint];
        }
        catch (error) {
            console.error('Error fetching SOL price:', error);
            return null;
        }
    });
}
function getTokensPrice(mints) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetchData(`https://api-v3.raydium.io/mint/price?mints=${mints.join(',')}`);
            return response.data;
        }
        catch (error) {
            console.error('Error fetching SOL price:', error);
            return null;
        }
    });
}
function getTokenList() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetchData(`https://api-v3.raydium.io/mint/list`);
            const response1 = yield fetchData(`https://tokens.jup.ag/tokens?tags=lst,community`);
            return [...response.data.mintList, ...response1];
        }
        catch (error) {
            console.error('Error fetching SOL price:', error);
            return null;
        }
    });
}
