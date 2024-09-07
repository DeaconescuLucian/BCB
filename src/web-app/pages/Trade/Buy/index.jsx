import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../../../components/SearchBar';
import { useSelector, useDispatch } from 'react-redux';
import {
  deselectWallet,
  updateSelectedWallet,
  getWalletDetails,
  fetchWallets,
} from '../../../store//reducers/wallets.js';
import Button from '../../../components/FormControls/Button';
import CopyToClipboard from '../../../components/CopyToClipboard/index.tsx';
import { walletSvg, coinSvg } from '../../../assets/svg';
import Loading from '../../../components/Loading/index.tsx';
import { useToast } from '../../../contexts/ToastContext.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import Slider from '../../../components/Slider/index.tsx';
import SolanaCoin from '../../../assets/icons/solana-coin.webp';
import DefaultCoin from '../../../assets/icons/coin.png';
import Input from '../../../components/FormControls/Input.tsx';
import Switch from '../../../components/Switch/index.tsx';
import { formatNumber } from '../../../utils.js';
import Collapse from '../../../components/Collapse/index.tsx';
import { backSvg } from '../../../assets/svg';
import { navigateBack, checkForPreviousLocation } from '../../../utils.js';
import { useNavigate } from 'react-router-dom';

function Buy() {
  const { selectedWalletDetails, selectedWalletAccounts, wallets } = useSelector((state) => state.wallets);
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [amountToBuy, setAmountToBuy] = useState(0);
  const [simulate, setSimulate] = useState(false);
  const [solanaPrice, setSolanaPrice] = useState(0);
  const [fee, setFee] = useState(0.00005);
  const [wrapAmount, setWrapAmount] = useState(0);
  const [wsolBalance, setWsolBalance] = useState(0);
  const loadingParentRef = useRef(null);
  const navigate = useNavigate();

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
      const publicKey = window.location.search
        .split('?')[1]
        .split('&')[0]
        .split('=')[1];
      const mint = window.location.search
        .split('?')[1]
        .split('&')[1]
        .split('=')[1];
      dispatch(deselectWallet());
      dispatch(updateSelectedWallet(publicKey));
      dispatch(getWalletDetails(publicKey));
      handleTokenSearch(mint, publicKey);
    } catch (error) {
      console.log(error);
    }

    return () => {
      dispatch(deselectWallet());
    };
  }, []);

  useEffect(() => {
    setWsolBalance(
      selectedWalletAccounts?.find((e) => e.mint === 'So11111111111111111111111111111111111111112')?.amount || 0
    );
  }, [selectedWalletAccounts]);

  useEffect(() => {
    setAmountToBuy(wsolBalance / 2);
    setToken(null);
  }, [wsolBalance]);

  const wrapSol = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.wrapEvent, {
      wallet: selectedWalletDetails?.publicKey,
      amount: wrapAmount,
      simulate: simulate,
    });
    if (result) {
      if (result.data.message) {
        let publicKey = selectedWalletDetails?.publicKey;
        dispatch(updateSelectedWallet(publicKey));
        dispatch(getWalletDetails(publicKey));
        setLoading(false);
        showToast(result.data.message, 'success');
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
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
      if (result.data.message) {
        let publicKey = selectedWalletDetails?.publicKey;
        dispatch(updateSelectedWallet(publicKey));
        dispatch(getWalletDetails(publicKey));
        setLoading(false);
        showToast(result.data.message, 'success');
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
      }
    }
  };

  const buy = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.buyEvent, {
      params: {
        wallet: selectedWalletDetails?.publicKey,
        mint: token?.mint,
        amount: amountToBuy,
      },
      fees: fee,
      simulate: simulate,
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

  const handleTokenSearch = async (mint, publicKey) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.getTokenDetailsEvent, mint);
    if (result && result.success) {
      const result1 = await window.electron.invoke(CustomEvents.getTokenPriceEvent, mint);
      setToken({ ...result.data, price: result1.data });
      setLoading(false);
      window.localStorage.setItem(
        'url',
        `/trade/buy?pub=${publicKey ? publicKey : selectedWalletDetails.publicKey}&mint=${mint}`
      );
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
      <div className="title-item">
        <span className="value  truncate">{selectedWalletDetails.alias}</span>
      </div>
      <div className="title-item">
        <span className="value truncate">{selectedWalletDetails.publicKey}</span>
        <CopyToClipboard text={selectedWalletDetails.publicKey}></CopyToClipboard>
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

  const walletSearchBar = (
    <div className="wallet-selector">
      {walletSvg}
      <SearchBar
        searchArray={wallets}
        displayTemplate={(wallet) => `alias: ${wallet.alias}    balance: ${wallet.balance} (${wallet.publicKey})`}
        matchProperties={[
          { name: 'alias', fullMatch: false },
          { name: 'publicKey', fullMatch: true },
        ]}
        onSearch={(wallet) => {
          window.localStorage.setItem('url', `/trade/buy?pub=${wallet.publicKey}`);
          dispatch(deselectWallet());
          dispatch(updateSelectedWallet(wallet.publicKey));
          dispatch(getWalletDetails(wallet.publicKey));
        }}
        placeholder="Search wallets by name or public key"
      ></SearchBar>
    </div>
  );

  const walletHeaderExpanded = selectedWalletDetails && (
    <div className="overview-panel">
      <div className="header">
        <h3>Wallet Overview</h3>
      </div>
      <div className="overview-item">
        <span className="label sol">SOL Balance</span>
        <span className="value">
          {formatNumber(selectedWalletDetails.balance)}{' '}
          <span>( ${formatNumber(Number((selectedWalletDetails.balance * solanaPrice).toFixed(2)))} )</span>
        </span>
      </div>
      <div className="overview-item">
        <span className="label wsol">WSOL Balance</span>
        <span className="value">
          {formatNumber(wsolBalance)} <span>( ${formatNumber(Number((wsolBalance * solanaPrice).toFixed(2)))} )</span>
        </span>
      </div>
    </div>
  );

  const walletHeaderCollapsed = selectedWalletDetails && (
    <div className="overview-panel">
      <div className="header">
        <h3>Wallet Overview</h3>
      </div>
    </div>
  );

  const walletHeader = selectedWalletDetails && (
    <Collapse
      expandContent={walletHeaderExpanded}
      collapseContent={walletHeaderCollapsed}
      expandedByDefault={true}
    ></Collapse>
  );

  const tokenSearchBar = selectedWalletDetails && (
    <div className="wallet-selector">
      {coinSvg}
      <SearchBar
        onSearch={(mint) => {
          handleTokenSearch(mint);
        }}
        remoteSearch={true}
        placeholder="Search token by mint"
      ></SearchBar>
    </div>
  );

  const tokenHeaderExpanded = token && (
    <div className="overview-panel">
      <div className="header">
        <h3>Token Overview</h3>
      </div>
      <div className="overview-item has-image">
        <span className="label">Token</span>
        <span className="value  truncate">
          {<img src={token.icon ? token.icon : DefaultCoin}></img>}
          {token.name} ({token.symbol ?? 'Unknown'})
        </span>
      </div>
      <div className="overview-item">
        <span className="label">Mint</span>
        <span className="value truncate">{token.mint}</span>
        <CopyToClipboard text={token.mint}></CopyToClipboard>
      </div>
      <div className="overview-item">
        <span className="label">Price</span>
        <span className="value truncate">$ {token.price ? formatNumber(Number(token.price).toFixed(10)) : '-'}</span>
      </div>
    </div>
  );

  const tokenHeaderCollapsed = token && selectedWalletDetails && (
    <div className="overview-panel">
      <div className="header">
        <h3>Token Overview</h3>
      </div>
    </div>
  );

  const tokenHeader = token && selectedWalletDetails && (
    <Collapse
      expandContent={tokenHeaderExpanded}
      collapseContent={tokenHeaderCollapsed}
      expandedByDefault={true}
    ></Collapse>
  );

  const wrapOrUnwrapBodyExpanded = selectedWalletDetails && (
    <div className="overview-panel">
      <div className="wrap-unrwap-container">
        <div className="wrap">
          <div className="title sol">Wrap SOL</div>
          <div className="fee-selector">
            <div className="label sol">SOL</div>
            <Slider
              min={0}
              max={selectedWalletDetails?.balance - 0.001 > 0 ? selectedWalletDetails?.balance - 0.001 : 0}
              value={wrapAmount}
              onChange={(value) => setWrapAmount(value)}
              theme="primary"
              step="0.00001"
            ></Slider>
          </div>
          <Button
            onClick={() => {
              wrapSol();
            }}
            theme="dark"
            text="Wrap"
            disabled={wrapAmount <= 0}
          ></Button>
        </div>
        <div className="wrap">
          <div className="title wsol">Unwrap WSOL</div>
          <div className="fee-selector">
            <div className="label wsol">WSOL</div>
            <Input type="number" theme="primary" readonly={true} readOnlyValue={wsolBalance}></Input>
          </div>
          <Button
            onClick={() => {
              unwrapSol();
            }}
            theme="dark"
            text="Unwrap"
            disabled={wsolBalance <= 0}
          ></Button>
        </div>
      </div>
    </div>
  );

  const wrapOrUnwrapBodyCollapsed = selectedWalletDetails && (
    <div className="overview-panel">
      <div className="wrap-unrwap-container collapsed">
        <div className="wrap">
          <div className="title ">
            <h3 className="sol">Wrap SOL</h3>
          </div>
          <div className="title">
            <h3> / </h3>
          </div>
          <div className="title wsol">
            <h3 className="wsol">Unwrap WSOL</h3>
          </div>
        </div>
      </div>
    </div>
  );

  const wrapOrUnwrapBody = selectedWalletDetails && (
    <Collapse
      expandContent={wrapOrUnwrapBodyExpanded}
      collapseContent={wrapOrUnwrapBodyCollapsed}
      expandedByDefault={false}
    ></Collapse>
  );

  const tokenBody = token && selectedWalletDetails && (
    <div className="buy-panel">
      <div className="amount-selector">
        <span className="label">
          <img src={SolanaCoin} />
        </span>
        <span>
          {' '}
          <Slider
            min={0}
            max={wsolBalance}
            value={wsolBalance / 2}
            onChange={(value) => setAmountToBuy(value)}
            theme="primary"
            step="0.000000001"
          ></Slider>
        </span>
      </div>
      <div className="token-amount">
        <div className="label">
          <img src={token.icon ? token.icon : DefaultCoin}></img>
        </div>
        <Input
          type="number"
          theme="primary"
          readonly={true}
          readOnlyValue={token.price ? (amountToBuy || 0) * (solanaPrice / token.price) : 0}
        ></Input>
      </div>
      <div className="trade-value">
        <span>${formatNumber(Number((amountToBuy * solanaPrice).toFixed(2)))}</span>
      </div>
      <div className="button-container">
        <div className="optional-selectors">
          <div className="fee-selector">
            <div className="label">
              Fee <span className="currency">(SOL)</span>
            </div>
            <Slider
              min={0}
              max={0.0001}
              value={fee}
              onChange={(value) => setFee(value)}
              theme="primary"
              step="0.00001"
            ></Slider>
            <span className="fee-dollar-value">$ {(fee * solanaPrice).toFixed(4)}</span>
          </div>

          <Button
            onClick={() => {
              buy();
            }}
            theme="dark"
            type="purchase"
            text="Buy"
            disabled={amountToBuy <= 0}
          ></Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="buy-page" ref={loadingParentRef}>
      {walletTitle}
      {walletSearchBar}
      {walletHeader}
      {wrapOrUnwrapBody}
      {tokenSearchBar}
      {tokenHeader}
      {tokenBody}
      {loading && <Loading parentRef={loadingParentRef}></Loading>}
    </div>
  );
}

export default Buy;
