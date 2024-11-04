import React, { useState, useEffect, useRef } from 'react';
import Tabstrip from '../../../components/Tabstrip/index.tsx';
import { useNavigate } from 'react-router-dom';
import TokenSelector from '../../../components/TokenSelector/index.tsx';
import { navigateAndSave } from '../../../utils.js';
import { backSvg, swapSvg, walletSvg } from '../../../assets/svg/index.jsx';
import Button from '../../../components/FormControls/Button.tsx';
import { updatePageSettings } from '../../../utils.js';
import FeeAndSlippageSelector from '../../../components/FeeAndSlippageSelector/index.tsx';
import { useSelector, useDispatch } from 'react-redux';
import { updateSelectedWallet, getWalletDetails, fetchWallets } from '../../../store/reducers/wallets.js';
import { CustomEvents } from '../../../../ts/events.ts';
import { useToast } from '../../../contexts/ToastContext.tsx';
import Switch from '../../../components/Switch/index.tsx';
import Slider from '../../../components/Slider/index.tsx';
import WalletSelector from '../../../components/WalletSelector/index.tsx';
import Input from '../../../components/FormControls/Input.tsx';
import { formatNumber, navigateBack, checkForPreviousLocation } from '../../../utils.js';
import Loading from '../../../components/Loading/index.tsx';

function Transfer() {
  const pageSettings = 'transfer-settings';
  let transferSettingsString = window.localStorage.getItem(pageSettings);
  let transferSettings = null;
  if (transferSettingsString) {
    transferSettings = JSON.parse(transferSettingsString);
  }
  const [tabs] = useState([
    { name: 'SOL', url: '/transfer' },
    { name: 'Token', url: '/transfer' },
  ]);
  const [activeTab, setActiveTab] = useState(
    transferSettings?.activeTab
      ? tabs.find((t) => t.name === transferSettings?.activeTab)
      : { name: 'SOL', url: '/transfer' }
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wallets } = useSelector((state) => state.wallets);
  const [simulate, setSimulate] = useState(JSON.parse(window.localStorage.getItem('swap-settings')).simulate || false);
  const { fee } = useSelector((state) => state.feeAndSlippage);
  const [loading, setLoading] = useState(false);
  const loadingParentRef = useRef(null);
  const { showToast } = useToast();
  const [wallet1, setWallet1] = useState(
    transferSettings?.wallet1 ? wallets.find((w) => w.publicKey === transferSettings?.wallet1) : null
  );
  const [wallet2, setWallet2] = useState(
    transferSettings?.wallet2 ? wallets.find((w) => w.publicKey === transferSettings?.wallet2) : null
  );
  const [wallet1Accounts, setWallet1Accounts] = useState([]);
  const [wsolToken, setWsolToken] = useState(null);
  const [token, setToken] = useState(transferSettings?.token ?? null);
  const [tokenAmount, setTokenAmount] = useState(transferSettings?.tokenAmount ?? null);
  const [tokenPrice, setTokenPrice] = useState(transferSettings?.tokenPrice ?? 0);
  const [solanaPrice, setSolanaPrice] = useState(0);
  const [amount, setAmount] = useState(transferSettings?.amount ?? 0);
  const [inputError, setInputError] = useState(null);

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

  const updateDataAfterNavigation = async (mint, wallet) => {
    setActiveTab(tabs.find(t => t.name === 'Token'))
    setWallet1(wallets.find(w => w.publicKey === wallet));
    const result = await window.electron.invoke(CustomEvents.getWalletDetailsEvent, wallet1?.publicKey);
    if (result && result.success) {
      let newTokenList =
        result.data
          ?.filter((e) => e.isNft === 0)
          .map((a) => ({
            address: a.mint,
            name: a.name,
            symbol: a.symbol,
            logoURI: a.icon,
            amount: a.amount,
            favouriteIndex: a.favouriteIndex,
          }))
          .sort((a, b) => {
            if (a.favouriteIndex === null) return 1;
            if (b.favouriteIndex === null) return -1;
            return a.favouriteIndex - b.favouriteIndex;
          }) || [];

      setLoading(false);
      setToken(newTokenList.find(t => t.address === mint));
    }

    const tPrice = await handleGetTokenPrice(mint);
    setTokenPrice(tPrice);
    window.localStorage.setItem('url', '/trade/transfer');
  };

  useEffect(() => {
    getWsolToken();
    updateSolanaPrice();
    try{
      const mint = window.location.search?.split('?')[1]?.split('&')[0]?.split('=')[1];
      const wlt = window.location.search?.split('?')[1]?.split('&')[1]?.split('=')[1];
      if(mint && wlt)
      {
        updateDataAfterNavigation(mint, wlt);
      }
    }
    catch(e)
    {
      console.error(e);
    }

  }, []);

  useEffect(() => {
    updatePageSettings('wallet1', wallet1?.publicKey, pageSettings);
    getWallet1Accounts();
  }, [wallet1]);

  useEffect(() => {
    updatePageSettings('wallet2', wallet2?.publicKey, pageSettings);
  }, [wallet2]);

  useEffect(() => {
    updatePageSettings('amount', amount, pageSettings);
  }, [amount]);

  useEffect(() => {
    updatePageSettings('activeTab', activeTab.name, pageSettings);
  }, [activeTab]);

  useEffect(() => {
    updatePageSettings('token', token, pageSettings);
  }, [token]);

  useEffect(() => {
    updatePageSettings('tokenAmount', tokenAmount, pageSettings);
  }, [tokenAmount]);

  useEffect(() => {
    updatePageSettings('tokenPrice', tokenPrice, pageSettings);
  }, [tokenPrice]);

  const handleUpdateWallet = async () => {
    setLoading(true);
    if (wallet1) {
      const result = await window.electron.invoke(CustomEvents.updateWalletEvent, {
        publicKey: wallet1.publicKey,
        existingMints: wallet1Accounts.map((e) => ({ mint: e.mint, icon: e.icon })),
      });
      if (result) {
        if (result.success) {
          await getWallet1Accounts();
          dispatch(fetchWallets());
          showToast('Wallet updated successfully', 'success');
        } else {
          showToast(result.error, 'fail');
        }
        setLoading(false);
      }
    }
  };

  const handleGetTokenPrice = async (mint) => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.getTokenPriceEvent, mint);
    setLoading(false);
    return result.data;
  };

  const getWallet1Accounts = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.getWalletDetailsEvent, wallet1?.publicKey);
    if (result && result.success) {
      let newTokenList =
        result.data
          ?.filter((e) => e.isNft === 0)
          .map((a) => ({
            address: a.mint,
            name: a.name,
            symbol: a.symbol,
            logoURI: a.icon,
            amount: a.amount,
            favouriteIndex: a.favouriteIndex,
          }))
          .sort((a, b) => {
            if (a.favouriteIndex === null) return 1;
            if (b.favouriteIndex === null) return -1;
            return a.favouriteIndex - b.favouriteIndex;
          }) || [];

      setLoading(false);
      setWallet1Accounts(newTokenList);
    }
  };

  const reverse = () => {
    setToken(null);
    setAmount(wallet2.balance / 2);
    setTokenAmount(0);
    setWallet1(wallet2);
    setWallet2(wallet1);
  };

  const validateTokenAmount = (val) => {
    if (val > token?.amount) {
      setInputError('Insufficient token balance');
      return 'Insufficient token balance';
    }
    setInputError(null);
    return null;
  };

  const validateAmount = (val) => {
    if (val > Number(wallet1?.balance)) {
      setInputError('Insufficient SOL balance');
      return 'Insufficient SOL balance';
    }
    setInputError(null);
    return null;
  };

  const simpleTransfer = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.simpleTransferEvent, {
      walletA: wallet1?.publicKey,
      walletB: wallet2?.publicKey,
      amount: amount,
      simulate: simulate,
      fee: fee,
    });
    if (result) {
      if (result.data) {
        if (result.data.message) {
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

  const tokenTransfer = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.tokenTransferEvent, {
      walletA: wallet1?.publicKey,
      walletB: wallet2?.publicKey,
      mint: token?.address,
      amount: tokenAmount,
      simulate: simulate,
      fee: fee,
    });
    if (result) {
      if (result.data) {
        if (result.data.message) {
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

  const walletTitle = wallet1 ? (
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

  !!wallet1 && !!wallet2 && activeTab.name === 'SOL' && amount > 0;
  const detailsContainer = (
    <div className="tranfer-details-container">
      {!!wallet1 &&
      !!wallet2 &&
      ((activeTab.name === 'SOL' && amount > 0) || (activeTab.name === 'Token' && tokenAmount > 0 && !!token)) ? (
        <div className="summary">
          <span>Transfer </span>
          {activeTab.name === 'SOL' ? (
            <span className="amount">{formatNumber(Number(amount).toFixed(9))} </span>
          ) : (
            <span className="amount">{formatNumber(Number(tokenAmount).toFixed(9))} </span>
          )}
          {activeTab.name === 'SOL' ? (
            <span className="token"> SOL</span>
          ) : (
            <span className="token"> {token.symbol} </span>
          )}
          <span>&nbsp; from &nbsp;</span>
          <span className="alias">{wallet1?.alias} </span>         
          <span>&nbsp; to &nbsp;</span>
          <span className="alias">{wallet2?.alias} </span>          
        </div>
      ) : (
        <div className="error">Select wallets and a token amount to make a transfer.</div>
      )}
      <div className="button-container">
        {' '}
        <Button text={'Transfer'} theme="primary" onClick={() => {
            if(activeTab.name === 'SOL')
            {
                simpleTransfer();
            }
            else
            {
                tokenTransfer();
            }
        }}></Button>
      </div>
    </div>
  );

  return (
    <div className="transfer-page" ref={loadingParentRef}>
      {walletTitle}
      <div className="transfer-data">
        <div className="left-side side">
          <div className="swap-container">
            <div className="swap-token-selector-container">
              <div className="swap-token-selector-header">
                <span>From Wallet</span>
              </div>
              <div className="swap-token-selector-body">
                <WalletSelector
                  onChange={async (w) => {
                    setWallet1(w);
                    setToken(null);
                    setAmount(w.balance / 2);
                    setTokenAmount(0);
                  }}
                  initialWallet={wallet1}
                  walletList={wallets}
                  hasRemoteSearch={false}
                  isMain={false}
                ></WalletSelector>
                <div className="value-container">
                  <Input readOnlyValue={wallet1?.alias || ''} type="text" theme="primary" readonly={true}></Input>
                  <div className="value truncate">{wallet1?.publicKey}</div>
                </div>
              </div>
            </div>
            <div className="reverse">
              <div
                className="svg-container"
                onClick={() => {
                  reverse();
                }}
              >
                {swapSvg}
              </div>
            </div>
            <div className="swap-token-selector-container">
              <div className="swap-token-selector-header">To Wallet</div>
              <div className="swap-token-selector-body">
                <WalletSelector
                  onChange={(w) => {
                    setWallet2(w);
                  }}
                  initialWallet={wallet2}
                  walletList={wallets}
                  hasRemoteSearch={false}
                  isMain={false}
                ></WalletSelector>
                <div className="value-container">
                  <Input readOnlyValue={wallet2?.alias || ''} type="text" theme="primary" readonly={true}></Input>
                  <div className="value truncate">{wallet2?.publicKey}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="right-side side">
          <div className="transfer-type-container">
            <Tabstrip
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
              }}
            ></Tabstrip>
            <div className="transfer-type-container-content">
              {activeTab?.name === 'SOL' ? (
                <div className="swap-container">
                  <div className="swap-token-selector-container">
                    <div className="swap-token-selector-header">
                      <span>SOL Amount</span>
                      <div className="balance-container">
                        <span className="balance">
                          {' '}
                          {walletSvg}
                          {formatNumber(wallet1?.balance)}
                        </span>
                        <Slider
                          min={0}
                          max={wallet1?.balance || 0}
                          value={amount || 0}
                          onChange={(value) => {
                            setAmount(value);
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
                          value={amount}
                          type="number"
                          theme="primary"
                          onChange={(val) => setAmount(val)}
                          validate={validateAmount}
                        ></Input>
                        <div className="value">~ ${formatNumber(amount * solanaPrice)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="swap-container">
                  <div className="swap-token-selector-container">
                    <div className="swap-token-selector-header">
                      <span>Token Amount</span>
                      <div className="balance-container">
                        <span className="balance">
                          {' '}
                          {walletSvg}
                          {formatNumber(token?.amount)}
                        </span>
                        <Slider
                          min={0}
                          max={token?.amount || 0}
                          value={tokenAmount}
                          onChange={(value) => {
                            setTokenAmount(value);
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
                          setToken(t);
                          setTokenAmount(t.amount / 2);
                          const tPrice = await handleGetTokenPrice(t.address);
                          setTokenPrice(tPrice);
                        }}
                        initialToken={token}
                        tokenList={wallet1Accounts}
                        hasRemoteSearch={false}
                      ></TokenSelector>
                      <div className="value-container">
                        <Input
                          value={tokenAmount}
                          type="number"
                          theme="primary"
                          onChange={(val) => {
                            setTokenAmount(val);
                          }}
                          validate={validateTokenAmount}
                          readonly={!!!token}
                        ></Input>
                        <div className="value">~ ${Number(formatNumber(tokenAmount * tokenPrice)).toFixed(9)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {detailsContainer}
      {loading && <Loading parentRef={loadingParentRef}></Loading>}
    </div>
  );
}

export default Transfer;
