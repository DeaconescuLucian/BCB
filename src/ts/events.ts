
export type ScriptConfig = {
  file: string;
  startEvent: string;
  stopEvent: string;
  updateEvent: string;
  type?: string;
};

export type ConfigDict = {
  MAIN: ScriptConfig;
  WALLET: ScriptConfig;
  TRANSACTION: ScriptConfig;
  [key: string]: ScriptConfig;
};

export const ProcessType: ConfigDict = {
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

export const CustomEvents = {
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
  swapEvent: 'swap',
  wrapEvent: 'wrap',
  unwrapEvent: 'unwrap',
  getTokenList: 'get-token-list',
  addTokenEvent: 'add-token',
  getWSOLEvent: 'get-wsol',
  deactivateConnectionEvent: 'deactivate-connection',
  addTokenToFavouritesEvent: 'add-token-to-favourites',
  removeTokenFromFavouritesEvent: 'remove-token-from-favourites',
  simpleTransferEvent: 'simple-transfer',
  tokenTransferEvent: 'token-transfer',
  getPoolFiltersEvent: 'get-pool-filters',
  createTrackProcessEvent: 'create-track-process',
  getTrackProcessesEvent: 'get-track-processes'
};

export function verifyUniqueEvents(processType: ConfigDict): boolean {
  const eventSet = new Set<string>(Object.values(CustomEvents));

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
