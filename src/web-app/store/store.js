import { configureStore } from '@reduxjs/toolkit';
import walletsReducer from './reducers/wallets';
import terminalReducer from './reducers/terminal';
import feeAndSlippageReducer from './reducers/feeAndSlippage';
import poolFiltersReducer from './reducers/poolFilters';
import trackProcessReducer from './reducers/trackProcess';
import dataCollectorReducer from './reducers/dataCollectors';

const store = configureStore({
  reducer: {
    wallets: walletsReducer,
    terminal: terminalReducer,
    feeAndSlippage: feeAndSlippageReducer,
    poolFilters: poolFiltersReducer,
    trackProcess: trackProcessReducer,
    dataCollector: dataCollectorReducer
  },
});

export default store;