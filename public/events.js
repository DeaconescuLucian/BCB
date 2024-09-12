"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomEvents = exports.ProcessType = void 0;
exports.verifyUniqueEvents = verifyUniqueEvents;
exports.ProcessType = {
    MAIN: {
        file: 'main.js',
        startEvent: 'start-main-process',
        stopEvent: 'stop-main-process',
        updateEvent: 'main-update',
    },
    WALLET: {
        file: 'wallet.js',
        startEvent: 'start-wallet-process',
        stopEvent: 'stop-wallet-process',
        updateEvent: 'wallet-update',
        type: 'wallet'
    },
    TRANSACTION: {
        file: 'transaction.js',
        startEvent: 'start-transaction-process',
        stopEvent: 'stop-transaction-process',
        updateEvent: 'transaction-update',
        type: 'transaction',
    },
};
exports.CustomEvents = {
    importWalletEvent: 'import-wallet',
    generateWalletEvent: 'generate-wallet',
    saveWalletEvent: 'save-wallet',
    getLatestTransactionsEvent: 'get-latest-transactions',
    getWalletsEvent: 'get-wallets',
    getWalletDetailsEvent: 'get-wallet-details',
    updateWalletEvent: 'update-wallet-info',
    deleteWalletEvent: 'delete-wallet',
    createConnectionEvent: 'create-connection',
    updateActiveConnectionEvent: 'update-active-connection',
    deleteConnectionEvent: 'delete-connection',
    getConnectionsEvent: 'get-connections',
    getTokenDetailsEvent: 'get-token-details',
    getTokensPricesEvent: 'get-token-prices',
    getTokenPriceEvent: 'get-token-price',
    buyEvent: 'buy',
    wrapEvent: 'wrap',
    unwrapEvent: 'unwrap',
    getTokenList: 'get-token-list',
    addTokenEvent: 'add-token'
};
function verifyUniqueEvents(processType) {
    const eventSet = new Set(Object.values(exports.CustomEvents));
    for (const key in processType) {
        if (processType.hasOwnProperty(key)) {
            const config = processType[key];
            const events = [config.startEvent, config.stopEvent, config.updateEvent];
            for (const event of events) {
                if (eventSet.has(event)) {
                    console.error(`Duplicate event name found: ${event}`);
                    return false;
                }
                eventSet.add(event);
            }
        }
    }
    return true;
}
