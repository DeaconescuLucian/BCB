import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CustomEvents } from '../../../ts/events';

const initialState = {
  dataCollectors: [],
  fetchDataCollectorsDone: true,
  unsubscribe: null,
  error: null,
};

export const fetchDataCollectors = createAsyncThunk('dataCollector/dataCollectors', async (updateStatus) => {
  try {
    const result = await window.electron.invoke(CustomEvents.getDataCollectProcessesEvent);
    if (result && result.success) {
      const response = {
        data: result.data,
        updateStatus: updateStatus
      }
      return response;
    }
    throw new Error('Failed to data collectors processes');
  } catch (error) {
    console.error('Error fetching data collectors:', error);
    throw error;
  }
});

const dataCollectorSlice = createSlice({
  name: 'dataCollector',
  initialState,
  reducers: {
    updateDataCollector: (state, action) => {
      const update = action.payload;
      switch (update.updateType) {
        case 'start':
          state.dataCollectors = state.dataCollectors.map((track) =>
            track.id === update.id ? { ...track, isActive: true } : track
          );
          break;
        case 'stop':
          state.dataCollectors = state.dataCollectors.map((track) =>
            track.id === update.id ? { ...track, isActive: false } : track
          );
          break;
          default:
            break;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDataCollectors.pending, (state, action) => {
        if (action.meta.arg)
          state.fetchDataCollectorsDone = false;
      })
      .addCase(fetchDataCollectors.fulfilled, (state, action) => {
        state.dataCollectors = action.payload.data;
        if (action.payload.updateStatus)
          state.fetchDataCollectorsDone = true;
      })
  },
});

export const { updateDataCollector, unsubscribe } = dataCollectorSlice.actions;
export default dataCollectorSlice.reducer;
