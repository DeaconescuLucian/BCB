import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CustomEvents } from '../../../ts/events';

const initialState = {
  terminalHeight: 150,
  error: null,
};

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    updateTerminalHeight: (state, action) => {
      state.terminalHeight = action.payload;
    },
    
  },
});

export const { updateTerminalHeight } = terminalSlice.actions;
export default terminalSlice.reducer;
