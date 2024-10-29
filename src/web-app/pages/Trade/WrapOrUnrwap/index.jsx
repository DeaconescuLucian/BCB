import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Loading from '../../../components/Loading/index.tsx';
import { useToast } from '../../../contexts/ToastContext.tsx';
import { useNavigate } from 'react-router-dom';
import { updatePageSettings } from '../../../utils.js';
import { formatNumber, formatTinyNumber, tinyNumber, navigateBack, checkForPreviousLocation } from '../../../utils.js';
import { backSvg, walletSvg } from '../../../assets/svg/index.jsx';
import Switch from '../../../components/Switch/index.tsx';
import Button from '../../../components/FormControls/Button.tsx';
import TokenSelector from '../../../components/TokenSelector/index.tsx';
import Input from '../../../components/FormControls/Input.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import Slider from '../../../components/Slider/index.tsx';
import { updateSelectedWallet, getWalletDetails, fetchWallets } from '../../../store/reducers/wallets.js';
import FeeAndSlippageSelector from '../../../components/FeeAndSlippageSelector/index.tsx';

function WrapOrUnrwap() {
  const { selectedWalletDetails, selectedWalletAccounts, selectedWallet } = useSelector((state) => state.wallets);
  const { fee, slippage } = useSelector((state) => state.feeAndSlippage);
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [wrapAmount, setWrapAmount] = useState(selectedWalletDetails?.balance / 2);
  const [wsolBalance, setWsolBalance] = useState(0);
  const [wsolToken, setWsolToken] = useState(null);
  const [simulate, setSimulate] = useState(JSON.parse(window.localStorage.getItem('swap-settings')).simulate || false);
  const [solanaPrice, setSolanaPrice] = useState(0);
  const [inputError, setInputError] = useState(null);
  const loadingParentRef = useRef(null);

  const getWsolToken = async () => {
    const result = await window.electron.invoke(CustomEvents.getWSOLEvent);
    if (result && result.success) {
      setWsolToken(result.data);
    }
  };

  const updateSolanaPrice = async () => {
    const result1 = await window.electron.invoke(
      CustomEvents.getTokenPriceEvent,
      'So11111111111111111111111111111111111111112'
    );
    if (result1.success) setSolanaPrice(result1.data);
  };

  useEffect(() => {
    getWsolToken();
    updateSolanaPrice();
  }, []);

  useEffect(() => {
    setWsolBalance(
      selectedWalletAccounts?.find((e) => e.mint === 'So11111111111111111111111111111111111111112')?.amount || 0
    );
  }, [selectedWalletAccounts]);

  useEffect(() => {
    setWrapAmount(Number(selectedWalletDetails?.balance / 2).toFixed(9));
  }, [selectedWalletDetails]);

  const handleUpdateWallet = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.updateWalletEvent, {
      publicKey: selectedWalletDetails.publicKey,
      existingMints: selectedWalletAccounts.map((e) => ({ mint: e.mint, icon: e.icon })),
    });
    updateSolanaPrice();
    if (result) {
      if (result.success) {
        dispatch(getWalletDetails(selectedWalletDetails.publicKey));
        dispatch(fetchWallets());
        showToast('Wallet updated successfully', 'success');
      } else {
        showToast(result.error, 'fail');
      }
      setLoading(false);
    }
  };

  const wrapSol = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.wrapEvent, {
      wallet: selectedWalletDetails?.publicKey,
      amount: wrapAmount,
      simulate: simulate,
    });
    if (result) {
      if (result.data?.message) {
        dispatch(updateSelectedWallet(selectedWallet));
        dispatch(getWalletDetails(selectedWallet));
        setLoading(false);
        showToast(result.data.message, 'success');
      } else {
        if (result.data?.error) {
          showToast(result.data.error, 'fail');
        }
      }
      if (!result.data) {
        showToast('Something went wrong.', 'fail');
      }
    }
  };

  const unwrapSol = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.unwrapEvent, {
      wallet: selectedWalletDetails?.publicKey,
      amount: wsolBalance,
      simulate: simulate,
    });
    if (result) {
      if (result.data?.message) {
        dispatch(updateSelectedWallet(selectedWallet));
        dispatch(getWalletDetails(selectedWallet));
        showToast(result.data.message, 'success');
      } else {
        if (result.data?.error) {
          showToast(result.data.error, 'fail');
        }
      }
      if (!result.data) {
        showToast('Something went wrong.', 'fail');
      }
      setLoading(false);
    }
  };

  const walletTitle = selectedWalletDetails ? (
    <div className="wallet-title">
      <div className="title-item flex-spread">
        <span
          className={`back-button ${checkForPreviousLocation() ? '' : 'disabled'}`}
          onClick={() => {
            navigateBack(navigate);
          }}
        >
          {backSvg} Back
        </span>
        <div className="header-buttons">
          {' '}
          <FeeAndSlippageSelector></FeeAndSlippageSelector>
          <Switch
            theme="primary"
            value={simulate}
            label={'Simulate'}
            onChange={() => {
              updatePageSettings('simulate', !simulate, 'swap-settings');
              setSimulate(!simulate);
            }}
          ></Switch>
          <Button
            onClick={() => {
              handleUpdateWallet();
            }}
            theme="primary"
            type="reload"
            text="Reload"
          ></Button>
        </div>
      </div>
    </div>
  ) : (
    <div className="wallet-title no-wallet">
      <div className="title-item flex-spread">
        <span
          className="back-button"
          onClick={() => {
            navigateBack(navigate);
          }}
        >
          {backSvg} Back
        </span>
        <div className="header-buttons">
          {' '}
          <FeeAndSlippageSelector></FeeAndSlippageSelector>
          <Switch theme="primary" label={'Simulate'} value={simulate} onChange={() => setSimulate(!simulate)}></Switch>
          <Button
            onClick={() => {
              handleUpdateWallet();
            }}
            theme="primary"
            type="reload"
            text="Reload"
          ></Button>
        </div>
      </div>
    </div>
  );

  const validateAmount = (val) => {
    if (val > selectedWalletDetails.balance) {
      setInputError('Insufficient balance');
      console.log('gere');
      return 'Insufficient balance';
    }
    setInputError(null);
    return null;
  };

  const wrapUnrwapContainer = selectedWalletDetails && (
    <div className="swap-container">
      <div className="swap-token-selector-container">
        <div className="swap-token-selector-header">
          <span>Wrap</span>
          <div className="balance-container">
            <span className="balance">
              {' '}
              {walletSvg}
              {formatNumber((selectedWalletDetails?.balance || 0).toFixed(9))}
            </span>
            <Slider
              min={0}
              max={selectedWalletDetails?.balance || 0}
              value={wrapAmount || 0}
              onChange={(value) => {
                setWrapAmount(value);
              }}
              theme="primary"
              step="0.000000001"
              noInput={true}
            ></Slider>
          </div>
        </div>
        <div className="swap-token-selector-body">
          <TokenSelector initialToken={{ ...wsolToken, symbol: 'SOL' }} readOnly={true}></TokenSelector>
          <div className="value-container">
            <Input
              value={wrapAmount}
              type="number"
              theme="primary"
              onChange={(val) => setWrapAmount(val)}
              validate={validateAmount}
            ></Input>
            <div className="value">
              ~ ${wrapAmount && solanaPrice ? formatNumber((wrapAmount * solanaPrice).toFixed(9)) : '-'}
            </div>
          </div>
        </div>
        <Button
          text={'WRAP'}
          theme="primary"
          onClick={() => {
            wrapSol();
          }}
          disabled={wrapAmount > selectedWalletDetails?.balance || !!inputError}
          tooltipDisabled={inputError}
        ></Button>
      </div>
      <div className="reverse"></div>
      <div className="swap-token-selector-container">
        <div className="swap-token-selector-header">Unwrap</div>
        <div className="swap-token-selector-body">
          <TokenSelector initialToken={wsolToken} readOnly={true}></TokenSelector>
          <div className="value-container">
            <Input type="number" theme="primary" readonly readOnlyValue={wsolBalance ? wsolBalance : ''}></Input>
            <div className="value">
              ~ ${solanaPrice && wsolBalance ? formatNumber((wsolBalance * solanaPrice).toFixed(9)) : '-'}
            </div>
          </div>
        </div>
        <Button
          text={'UNWRAP'}
          theme="primary"
          onClick={() => {
            unwrapSol();
          }}
          disabled={wsolBalance <= 0}
          tooltipDisabled={'No WSOL to Unrwap'}
        ></Button>
      </div>
    </div>
  );

  return (
    <div className="buy-page wrap-page" ref={loadingParentRef}>
      {walletTitle}
      {wrapUnrwapContainer}
      {loading && <Loading parentRef={loadingParentRef}></Loading>}
    </div>
  );
}

export default WrapOrUnrwap;
