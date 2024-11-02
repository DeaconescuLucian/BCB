import React, { useState, useRef } from 'react';
import Dialog from '../Dialog';
import ClickOutside from '../ClickOutside';
import { useSelector, useDispatch } from 'react-redux';
import { crossSvg } from '../../assets/svg';
import SearchBar from '../SearchBar';
import CopyToClipboard from '../CopyToClipboard';
import { CustomEvents } from '../../../ts/events';
import { fetchWallets, getWalletDetails } from '../../store/reducers/wallets';
import Loading from '../Loading';

const SelectWalletDialog = (props) => {
  const {
    selectedWalletDetails,
    wallets,
    selectedWalletAccounts,
    fetchWalletsDone,
    getWalletDetailsDone,
  } = useSelector((state) => state.wallets);
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('');
  const [wallet, setWallet] = useState(props.wallet);
  const [loading, setLoading] = useState(false);
  const loadingParentRef = useRef(null);

  return (
    <Dialog className="token-selector-dialog wallet-dialog" onClose={props.onClose} ref={loadingParentRef}>
      <div className="token-selector-dialog-header">
        <div className="title">
          {' '}
          <span>Select a wallet</span>
          <span
            onClick={() => {
              setFilter('');
              props.onClose();
            }}
          >
            {crossSvg}
          </span>
        </div>
        <div className="subtitle">
          {' '}
          <span>Select your working wallet</span>
        </div>
        <div className="token-search-container">
          <SearchBar
            placeholder="Search wallet by alias"
            withDropDown={false}
            onChange={(value) => {
              setFilter(value);
            }}
          ></SearchBar>
        </div>
        <div className="token-list-header">
          <span>Wallet</span>
          <span>Balance/Address</span>
        </div>
      </div>
      <div className="token-list">
        <div className="token-list-body">
          {wallets.length > 0 &&
            wallets
              .filter((t) => t.alias?.toLowerCase().includes(filter.toLowerCase()))
              .map((t) => (
                <div
                  className={`token-list-item ${wallet?.publicKey === t.publicKey ? 'selected-wallet' : ''}`}
                  key={`toke-list-item-${t.publicKey}`}
                  onClick={async () => {
                    if (props.isMain) {
                      setLoading(true);
                      const result = await window.electron.invoke(CustomEvents.updateWalletEvent, {
                        publicKey: t.publicKey,
                        existingMints: selectedWalletAccounts.map((e) => ({ mint: e.mint, icon: e.icon })),
                      });
                      if (result) {
                        if (result.success) {
                          setWallet(t);
                          dispatch(fetchWallets, true);
                          dispatch(getWalletDetails(selectedWalletDetails.publicKey));
                        }
                      }
                      if (fetchWalletsDone && getWalletDetailsDone) {
                        props.onChange(t.publicKey);
                        setLoading(false);
                      }
                    } else {
                      setWallet(t);
                      props.onChange(t.publicKey);
                    }
                  }}
                >
                  <div className="left-side">
                    {' '}
                    <div className="name-container">
                      <div className="symbol">
                        <span className="truncate">{t.alias}</span>
                      </div>
                      <span className="name">{t.tokenAccounts} Token Accounts</span>
                    </div>
                  </div>
                  <div className="right-side">
                    <div className="amount">{t.balance} SOL</div>
                    <div className="address">
                      <span className="truncate">{t.publicKey}</span>{' '}
                      <CopyToClipboard text={t.publicKey}></CopyToClipboard>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
      {loading && <Loading parentRef={loadingParentRef} text="Getting wallet data"></Loading>}
    </Dialog>
  );
};

export default SelectWalletDialog;
