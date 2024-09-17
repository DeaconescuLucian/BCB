import { configureStore } from '@reduxjs/toolkit';
import walletsReducer from './reducers/wallets';
import terminalReducer from './reducers/terminal';
import feeAndSlippageReducer from './reducers/feeAndSlippage';

const store = configureStore({
  reducer: {
    wallets: walletsReducer,
    terminal: terminalReducer,
    feeAndSlippage: feeAndSlippageReducer
  },
});

export default store;