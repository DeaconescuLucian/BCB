import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CustomEvents } from '../../../ts/events';

const initialState = {
  poolFilters: [],
  fetchPoolFiltersDone: true,
  error: null,
};

export const fetchPoolFilters = createAsyncThunk('poolFilters/fetchPoolFilters', async (updateStatus) => {
  try {
    const result = await window.electron.invoke(CustomEvents.getPoolFiltersEvent);
    if (result && result.success) {
      const response = {
        data: result.data,
        updateStatus: updateStatus
      }
      return response;
    }
    throw new Error('Failed to fetch pool filters');
  } catch (error) {
    console.error('Error fetching pool filters:', error);
    throw error;
  }
});

const poolFiltersSlice = createSlice({
  name: 'poolFilters',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchPoolFilters.pending, (state, action) => {
        if (action.meta.arg)
          state.fetchTokensDone = false;
      })
      .addCase(fetchPoolFilters.fulfilled, (state, action) => {
        state.poolFilters = action.payload.data;
        if (action.payload.updateStatus)
          state.fetchPoolFiltersDone = true;
      })
  },
});

export default poolFiltersSlice.reducer;
