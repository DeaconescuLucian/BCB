import { configureStore } from '@reduxjs/toolkit';
import walletsReducer from './reducers/wallets';

const store = configureStore({
  reducer: {
    wallets: walletsReducer
  },
});

export default store;