import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CustomEvents } from '../../../ts/events';

const initialState = {
  trackProcesses: [],
  fetchTrackProcessesDone: true,
  error: null,
};

export const fetchTrackProcesses = createAsyncThunk('trackProcess/fetchTrackProcesses', async (updateStatus) => {
  try {
    const result = await window.electron.invoke(CustomEvents.getTrackProcessesEvent);
    if (result && result.success) {
      const response = {
        data: result.data,
        updateStatus: updateStatus
      }
      return response;
    }
    throw new Error('Failed to fetch track processes');
  } catch (error) {
    console.error('Error fetching track processes:', error);
    throw error;
  }
});

const trackProcessSlice = createSlice({
  name: 'trackProcess',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrackProcesses.pending, (state, action) => {
        if (action.meta.arg)
          state.fetchTrackProcessesDone = false;
      })
      .addCase(fetchTrackProcesses.fulfilled, (state, action) => {
        state.trackProcesses = action.payload.data;
        console.log(action.payload.data);
        if (action.payload.updateStatus)
          state.fetchTrackProcessesDone = true;
      })
  },
});

export default trackProcessSlice.reducer;
