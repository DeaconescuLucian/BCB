import { configureStore } from '@reduxjs/toolkit';
import walletsReducer from './reducers/wallets';
import terminalReducer from './reducers/terminal'

const store = configureStore({
  reducer: {
    wallets: walletsReducer,
    terminal: terminalReducer
  },
});

export default store;