import React, { useState, useEffect } from 'react';
import { settingsSvg } from '../../assets/svg/index.jsx';
import { useSelector, useDispatch } from 'react-redux';
import Dialog from '../Dialog';
import { crossSvg } from '../../assets/svg/index.jsx';
import Input from '../FormControls/Input';
import { updateFeeAndSlippage } from '../../store/reducers/feeAndSlippage.js';
import Button from '../FormControls/Button';
import { CustomEvents } from '../../../ts/events';

interface IFeeAndSlippageSelector {}

function FeeAndSlippageSelector(props: IFeeAndSlippageSelector) {
  const { fee, slippage } = useSelector((state: any) => state.feeAndSlippage);
  const { selectedWalletDetails } = useSelector((state: any) => state.wallets);
  const dispatch = useDispatch();
  const [showDialog, setShowDialog] = useState(false);
  const [feeValue, setFeeValue] = useState(fee);
  const [slippageValue, setSlippageValue] = useState(slippage);
  const [feeError, setFeeError] = useState((null as unknown) as string | null);
  const [slippageError, setSlippageError] = useState((null as unknown) as string | null);
  const [solanaPrice, setSolanaPrice] = useState(0);

  const updateSolanaPrice = async () => {
    const result1 = await window.electron.invoke(
      CustomEvents.getTokenPriceEvent,
      'So11111111111111111111111111111111111111112'
    );
    if (result1.success) setSolanaPrice(result1.data);
  };

  useEffect(() => {
    updateSolanaPrice();
  }, []);

  const validateFee = (val) => {
    let error: string | null = null;
    if (val < 0) error = "Prio Fee can't be less than 0";
    if (selectedWalletDetails && val > selectedWalletDetails?.balance) {
      error = 'Insuficient SOL balance';
    }
    setFeeError(error);
    return error;
  };

  const validateSlippage = (val) => {
    let error: string | null = null;
    if (val < 0) error = "Slippage can't be less than 0%";
    if (val > 100) {
      error = "Slippage can't be more than 100%";
    }
    setSlippageError(error);
    return error;
  };

  return (
    <div className="cog">
      {' '}
      <span>Prio Fee & Slippage</span>
      <span
        className="cog-icon"
        onClick={() => {
          setShowDialog(true);
        }}
      >
        {settingsSvg}
      </span>
      {showDialog && (
        <Dialog
          className="fee-and-slippage-dialog"
          onClose={() => {
            setShowDialog(false);
          }}
        >
          <div className="fee-and-slippage-dialog-header">
            <div className="title">
              {' '}
              <span>Prio Fee & Slippage Settings</span>
              <span
                onClick={() => {
                  setShowDialog(false);
                }}
              >
                {crossSvg}
              </span>
            </div>
            <div className="subtitle">
              {' '}
              <span>{'Customize you preferences'}</span>
            </div>
          </div>
          <div className="fee-and-slippage-dialog-content">
            <div className="title-row">
              {' '}
              <div className="title">Priority Fee</div>
              <div className="value">~$ {(solanaPrice * feeValue).toFixed(4)}</div>
            </div>
            <div className="fee-selector-container">
              <Input
                type="number"
                theme="primary"
                value={fee}
                onChange={(val) => {
                  setFeeValue(val);
                }}
                validate={validateFee}
              ></Input>
            </div>
            <div className="title-row">
              {' '}
              <div className="title">Swap slippage tolerance</div>
            </div>
            <div className="slippage-selector-container">
              <div className="slippage-items">
                {' '}
                <div
                  className={`slippage-item ${slippageValue === 0.1 ? 'selected-item' : ''}`}
                  onClick={() => {
                    setSlippageValue(0.1);
                  }}
                >
                  0.1%
                </div>
                <div
                  className={`slippage-item ${slippageValue === 0.5 ? 'selected-item' : ''}`}
                  onClick={() => {
                    setSlippageValue(0.5);
                  }}
                >
                  0.5%
                </div>
                <div
                  className={`slippage-item ${slippageValue === 1 ? 'selected-item' : ''}`}
                  onClick={() => {
                    setSlippageValue(1);
                  }}
                >
                  1%
                </div>
              </div>
              <div className="custom-slippage">
                <span>Custom</span>
                <Input
                  type="number"
                  theme="primary"
                  value={slippage}
                  onChange={(val) => {
                    setSlippageValue(val);
                  }}
                  validate={validateSlippage}
                ></Input>
                <span>%</span>
              </div>
            </div>
            <Button
              text={'Save Settings'}
              theme="primary"
              onClick={() => {
                dispatch(updateFeeAndSlippage({ fee: feeValue, slippage: slippageValue }));
                setShowDialog(false);
              }}
              type="save"
              disabled={!!feeError || !!slippageError}
              tooltipDisabled={feeError || slippageError || ''}
            ></Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default FeeAndSlippageSelector;
