import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../../../components/SearchBar/index.tsx';
import { useSelector, useDispatch } from 'react-redux';
import { updateSelectedWallet, getWalletDetails, fetchWallets } from '../../../store/reducers/wallets.js';
import Button from '../../../components/FormControls/Button.tsx';
import { walletSvg, coinSvg } from '../../../assets/svg/index.jsx';
import Loading from '../../../components/Loading/index.tsx';
import { useToast } from '../../../contexts/ToastContext.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import Slider from '../../../components/Slider/index.tsx';
import Input from '../../../components/FormControls/Input.tsx';
import Switch from '../../../components/Switch/index.tsx';
import { formatNumber, formatTinyNumber, tinyNumber } from '../../../utils.js';
import { backSvg, swapSvg } from '../../../assets/svg/index.jsx';
import { navigateBack, checkForPreviousLocation } from '../../../utils.js';
import { useNavigate } from 'react-router-dom';
import TokenSelector from '../../../components/TokenSelector/index.tsx';
import { updatePageSettings } from '../../../utils.js';

function Swap() {
  const { selectedWalletDetails, selectedWalletAccounts, tokens, selectedWallet } = useSelector(
    (state) => state.wallets
  );
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [token1, setToken1] = useState(null);
  const [token2, setToken2] = useState(null);
  const [token1Price, setToken1Price] = useState(null);
  const [token2Price, setToken2Price] = useState(null);
  const [priceRatio, setPriceRatio] = useState(undefined);
  const [amountToBuy, setAmountToBuy] = useState(0);
  const [simulate, setSimulate] = useState(JSON.parse(window.localStorage.getItem('swap-settings'))?.simulate || false);
  const [solanaPrice, setSolanaPrice] = useState(0);
  const [fee, setFee] = useState(0.00005);
  const [wrapAmount, setWrapAmount] = useState(0);
  const [wsolBalance, setWsolBalance] = useState(0);
  const [ownedTokenList, setOwnedTokenList] = useState([]);
  const [otherTokenList, setOtherTokenList] = useState([]);
  const [inputError, setInputError] = useState(null);
  const loadingParentRef = useRef(null);
  const navigate = useNavigate();

  const pageSettings = 'swap-settings';
  const updateSolanaPrice = async () => {
    const result1 = await window.electron.invoke(
      CustomEvents.getTokenPriceEvent,
      'So11111111111111111111111111111111111111112'
    );
    if (result1.success) setSolanaPrice(result1.data);
  };

  useEffect(() => {
    try {
      updateSolanaPrice();

      let swapSettings = window.localStorage.getItem('swap-settings');
      if (swapSettings) {
        swapSettings = JSON.parse(swapSettings);
        if (swapSettings.token1) {
          setToken1(swapSettings.token1);
          setToken1Price(swapSettings.token1Price);
          if (!amountToBuy && !swapSettings.amountToBuy)
            setAmountToBuy((ownedTokenList.find((t) => t.address === swapSettings.token1.address)?.amount || 0) / 2);
        }
        if (swapSettings.token2) {
          setToken2(swapSettings.token2);
          setToken2Price(swapSettings.token2Price);
        }
        if (swapSettings.amountToBuy) {
          setAmountToBuy(swapSettings.amountToBuy);
        }
        calculatePriceRatio(swapSettings.token1Price, swapSettings.token2Price);
      }
    } catch (error) {
      console.log(error);
    }
  }, []);

  const updateTokensAfterNavigation = async (type, token) => {
    if (type === 'mint1') {
      setToken1(token);
      setAmountToBuy(token.amount / 2);
      const tPrice = await handleGetTokenPrice(token.address);
      setToken1Price(tPrice);
      setToken2(null);
      setToken2Price(null);
      calculatePriceRatio(tPrice, null);
    }
    if (type === 'mint2') {
      setToken2(token);
      setAmountToBuy(0);
      const tPrice = await handleGetTokenPrice(token.address);
      setToken2Price(tPrice);
      setToken1(null);
      setToken1Price(null);
      calculatePriceRatio(null, tPrice);
    }
    window.localStorage.setItem('url', '/trade/swap');
  };

  useEffect(() => {
    setWsolBalance(
      selectedWalletAccounts?.find((e) => e.mint === 'So11111111111111111111111111111111111111112')?.amount || 0
    );
    const newOwnedTokenList =
      selectedWalletAccounts
        ?.filter((e) => e.isNft === 0)
        .map((a) => ({
          address: a.mint,
          name: a.name,
          symbol: a.symbol,
          logoURI: a.icon,
          amount: a.amount,
        })) || [];
    setOwnedTokenList(newOwnedTokenList);

    const type = window.location.search?.split('?')[1]?.split('=')[0];

    const mint = window.location.search?.split('?')[1]?.split('=')[1];

    const token = newOwnedTokenList.find((t) => t.address === mint)

    if (type && token) {
      updateTokensAfterNavigation(type, token);
    }
  }, [selectedWalletAccounts]);

  useEffect(() => {
    let wallet = JSON.parse(window.localStorage.getItem(pageSettings))?.wallet || '';
    if (selectedWallet !== wallet) {
      setToken1(null);
      setToken2(null);
      setToken1Price(null);
      setToken2Price(null);
      setPriceRatio(undefined);
      setAmountToBuy(0);
    }
  }, [selectedWallet]);

  useEffect(() => {
    setOtherTokenList(tokens);
  }, [tokens]);

  useEffect(() => {
    updatePageSettings('token1', token1, pageSettings);
    updatePageSettings('wallet', selectedWallet, pageSettings);
  }, [token1]);

  useEffect(() => {
    updatePageSettings('token2', token2, pageSettings);
    updatePageSettings('wallet', selectedWallet, pageSettings);
  }, [token2]);

  useEffect(() => {
    updatePageSettings('token1Price', token1Price, pageSettings);
  }, [token1Price]);

  useEffect(() => {
    updatePageSettings('token2Price', token2Price, pageSettings);
  }, [token2Price]);

  useEffect(() => {
    updatePageSettings('amountToBuy', amountToBuy, pageSettings);
  }, [amountToBuy]);

  const swap = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.swapEvent, {
      params: {
        wallet: selectedWalletDetails?.publicKey,
        mintA: token1.address,
        mintB: token2.address,
        amount: amountToBuy,
      },
      simulate: simulate,
      fees: 0.001,
    });
    if (result) {
      if (result.data) {
        if (result.data.message) {
          let publicKey = selectedWalletDetails?.publicKey;
          dispatch(updateSelectedWallet(publicKey));
          dispatch(getWalletDetails(publicKey));
          setLoading(false);
          showToast(result.data.message, 'success');
        } else {
          if (result.data.error) {
            setLoading(false);
            showToast(result.data.error, 'fail');
          }
        }
      } else {
        setLoading(false);
        showToast('Error processing transaction', 'fail');
      }
    }
  };

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

  const handleGetTokenPrice = async (mint) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.getTokenPriceEvent, mint);
    setLoading(false);
    return result.data;
  };

  const calculatePriceRatio = (price1, price2) => {
    if (!price1 || !price2) setPriceRatio(undefined);
    else return setPriceRatio(price1 / price2);
  };

  const validateAmount = (val) => {
    if (val > token1?.amount) {
      setInputError('Insufficient balance');
      return 'Insufficient balance';
    }
    setInputError(null);
    return null;
  };

  const reverseTokens = () => {
    let token2Address = token2?.address;
    let newAmount = ownedTokenList.find((t) => t.address === token2Address)?.amount || 0;
    let newToken1 = token2 ? { ...token2, amount: newAmount } : null;
    let newAmountToBuy = amountToBuy * (priceRatio || 0);
    setToken2(token1);
    setToken1(newToken1);
    if (newAmountToBuy < 0) newAmountToBuy = 0;
    if (newAmountToBuy > (newToken1?.amount || 0)) newAmountToBuy = newToken1?.amount || 0;
    setAmountToBuy(newAmountToBuy);
    setToken1Price(token2Price);
    setToken2Price(token1Price);
    calculatePriceRatio(token2Price, token1Price);
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
          <Switch
            theme="primary"
            value={simulate}
            onChange={() => {
              console.log('here1');
              updatePageSettings('simulate', !simulate, pageSettings);
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
          <Switch theme="primary" value={simulate} onChange={() => setSimulate(!simulate)}></Switch>
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

  const swapContainer = (
    <div className="swap-container">
      <div className="swap-token-selector-container">
        <div className="swap-token-selector-header">
          <span>From</span>
          <div className="balance-container">
            <span className="balance">
              {' '}
              {walletSvg}
              {formatNumber((token1?.amount || 0).toFixed(9))}
            </span>
            <Slider
              min={0}
              max={token1?.amount || 0}
              value={amountToBuy || 0}
              onChange={(value) => {
                setAmountToBuy(value);
              }}
              theme="primary"
              step="0.000000001"
              noInput={true}
            ></Slider>
          </div>
        </div>
        <div className="swap-token-selector-body">
          <TokenSelector
            onChange={async (t) => {
              setToken1(t);
              setAmountToBuy(t.amount / 2);
              const tPrice = await handleGetTokenPrice(t.address);
              setToken1Price(tPrice);
              calculatePriceRatio(tPrice, token2Price);
            }}
            initialToken={token1}
            tokenList={ownedTokenList}
            hasRemoteSearch={false}
          ></TokenSelector>
          <div className="value-container">
            <Input
              value={amountToBuy}
              type="number"
              theme="primary"
              onChange={(val) => setAmountToBuy(val)}
              validate={validateAmount}
            ></Input>
            <div className="value">
              ~ ${amountToBuy && token1Price ? formatNumber((amountToBuy * token1Price).toFixed(10)) : '-'}
            </div>
          </div>
        </div>
      </div>
      <div className="reverse">
        <div
          className="svg-container"
          onClick={() => {
            reverseTokens();
          }}
        >
          {swapSvg}
        </div>
      </div>
      <div className="swap-token-selector-container">
        <div className="swap-token-selector-header">To</div>
        <div className="swap-token-selector-body">
          <TokenSelector
            onChange={async (t) => {
              setToken2(t);
              const tPrice = await handleGetTokenPrice(t.address);
              setToken2Price(tPrice);
              calculatePriceRatio(token1Price, tPrice);
            }}
            initialToken={token2}
            tokenList={otherTokenList}
            hasRemoteSearch={true}
          ></TokenSelector>
          <div className="value-container">
            <Input
              type="number"
              theme="primary"
              readonly
              readOnlyValue={priceRatio && amountToBuy ? amountToBuy * priceRatio : ''}
            ></Input>
            <div className="value">
              ~ $
              {priceRatio && amountToBuy && token2Price
                ? formatNumber((amountToBuy * priceRatio * token2Price).toFixed(10))
                : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const detailsContainer = (
    <div className="swap-details-container">
      <div className="title">Ratio</div>
      {priceRatio ? (
        <div className="ratio-container">
          <div className="left-side">
            {' '}
            <span className="value">1 </span>
            <span className="currency">{`${token1?.symbol}`}</span>
          </div>
          <span className="middle"> &asymp; </span>
          <div className="right-side">
            <span className="value">{priceRatio < tinyNumber ? formatTinyNumber(priceRatio) : priceRatio?.toFixed(9)}</span> <span className="currency">{token2?.symbol}</span>
          </div>
        </div>
      ) : (
        <div className="ratio-error-container">
          {`We couldnt't retrieve the price for at least one token, but you can still make the Swap.`}
        </div>
      )}
      <div className="title">Prices</div>
      {token1 && (
        <div className="ratio-container">
          <div className="left-side">
            {' '}
            <span className="value">1 </span>
            <span className="currency">{`${token1?.symbol}`}</span>
          </div>
          <span className="middle">&asymp;</span>
          <div className="right-side">
            {' '}
            <span className="value">{token1Price ? token1Price < tinyNumber ? formatTinyNumber(Number(token1Price)) : Number(token1Price)?.toFixed(9) : '-'} </span>
            <span className="currency">$</span>
          </div>
        </div>
      )}
      {token2 && (
        <div className="ratio-container">
          <div className="left-side">
            {' '}
            <span className="value">1 </span>
            <span className="currency">{`${token2?.symbol}`}</span>
          </div>
          <span className="middle">&asymp;</span>
          <div className="right-side">
            {' '}
            <span className="value">{token2Price ? token2Price < tinyNumber ? formatTinyNumber(Number(token2Price)) : Number(token2Price)?.toFixed(9) : '-'} </span>
            <span className="currency">$</span>
          </div>
        </div>
      )}
      <Button
        text={'SWAP'}
        theme="primary"
        onClick={() => {
          swap();
        }}
        disabled={(!token1 && !token2) || !!inputError}
        tooltipDisabled={inputError || 'Select two tokens to SWAP'}
      ></Button>
    </div>
  );
  return (
    <div className="buy-page" ref={loadingParentRef}>
      {walletTitle}
      {swapContainer}
      {detailsContainer}
      {loading && <Loading parentRef={loadingParentRef}></Loading>}
    </div>
  );
}

export default Swap;
