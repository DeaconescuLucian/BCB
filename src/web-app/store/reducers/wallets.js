import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CustomEvents } from '../../../ts/events';

const initialState = {
  wallets: [],
  tokenPrices: [],
  tokens: [],
  selectedWallet: null,
  selectedWalletDetails: null,
  selectedWalletAccounts: null,
  status: 'idle',
  error: null,
};

export const fetchWallets = createAsyncThunk('wallets/fetchWallets', async () => {
  try {
    const result = await window.electron.invoke(CustomEvents.getWalletsEvent);
    if (result && result.success) {
      return result.data;
    }
    throw new Error('Failed to fetch wallets');
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
});

export const fetchTokens = createAsyncThunk('wallets/fetchTokens', async () => {
  try {
    const result = await window.electron.invoke(CustomEvents.getTokenList);
    if (result && result.success) {
      return result.data;
    }
    throw new Error('Failed to fetch wallets');
  } catch (error) {
    console.error('Error fetching wallets:', error);
    throw error;
  }
});

export const getWalletDetails = createAsyncThunk('wallets/getWalletDetails', async (publicKey) => {
  try {
    const result = await window.electron.invoke(CustomEvents.getWalletDetailsEvent, publicKey);
    if (result && result.success) {
      return result.data;
    }
    throw new Error('Failed to get wallet details');
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    throw error;
  }
});

export const getTokensPrices = createAsyncThunk('wallets/getTokensPrices', async (mints) => {
  try {
    const result = await window.electron.invoke(CustomEvents.getTokensPricesEvent, mints);
    if (result && result.success) {
      return result.data;
    }
    throw new Error('Failed to get tokens prices');
  } catch (error) {
    console.error('Error getting tokens prices:', error);
    throw error;
  }
});

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    updateSelectedWallet: (state, action) => {
      state.selectedWallet = action.payload;
      state.selectedWalletDetails = state.wallets.find(w => w.publicKey === state.selectedWallet);
    },
    updateWallets: (state, action) => {
      state.wallets = action.payload;
      state.status = 'succeeded';
    },
    addWallet: (state, action) => {
      state.wallets.push(action.payload);
    },
    removeWallet: (state, action) => {
      state.wallets = state.wallets.filter(wallet => wallet.publicKey !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.wallets = action.payload;
        state.selectedWalletDetails = state.wallets.find(w => w.publicKey === state.selectedWallet) || null;
      })
      .addCase(fetchTokens.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tokens = action.payload;
      })
      .addCase(getWalletDetails.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getWalletDetails.fulfilled, (state, action) => {
        state.selectedWalletAccounts = action.payload || [];
        state.status = 'succeeded'
      })
      .addCase(getTokensPrices.fulfilled, (state, action) => {
        state.tokenPrices = action.payload || [];
        state.status = 'succeeded'
      })
  },
});

export const { updateSelectedWallet, updateWallets, addWallet, removeWallet, deselectWallet } = walletsSlice.actions;
export default walletsSlice.reducer;
