import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    fee: 0.00005,
    slippage: 0.1
};

const feeAndSlippageSlice = createSlice({
    name: 'feeAndSlippage',
    initialState,
    reducers: {
        updateFeeAndSlippage: (state, action) => {
            state.fee = parseFloat(action.payload.fee);
            state.slippage = parseFloat(action.payload.slippage);
            window.localStorage.setItem('slippage', action.payload.slippage.toString());
            window.localStorage.setItem('fee', action.payload.fee.toString());
        },
        getValuesFromLocalStorage: (state) => {
            let fee = window.localStorage.getItem('fee');
            let slippage = window.localStorage.getItem('slippage');
            if(fee) {
                state.fee = parseFloat(fee);
            }
            if(slippage) {
                state.slippage = parseFloat(slippage);
            }
        }
    },
});

export const { updateFeeAndSlippage, getValuesFromLocalStorage } = feeAndSlippageSlice.actions;
export default feeAndSlippageSlice.reducer;
