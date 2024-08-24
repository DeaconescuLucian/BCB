import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CustomEvents } from '../../../ts/events';

// Define an initial state with appropriate structure
const initialState = {
  wallets: [], // Array to store wallet data
  status: 'idle', // To track the status of the async operation
  error: null, // To store any errors
};

// Define an async thunk for fetching wallets
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

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    // Define synchronous reducers if needed
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
      .addCase(fetchWallets.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWallets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.wallets = action.payload.map(e => e.wallet);
      })
      .addCase(fetchWallets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { updateWallets, addWallet, removeWallet } = walletsSlice.actions;
export default walletsSlice.reducer;