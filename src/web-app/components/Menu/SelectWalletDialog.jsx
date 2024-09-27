import React, { useState } from 'react';
import Dialog from '../Dialog';
import ClickOutside from '../ClickOutside';
import { useSelector, useDispatch } from 'react-redux';
import { crossSvg } from '../../assets/svg';
import SearchBar from '../SearchBar';
import CopyToClipboard from '../CopyToClipboard';

const SelectWalletDialog = (props) => {
  const { selectedWalletDetails, wallets } = useSelector((state) => state.wallets);
  const [filter, setFilter] = useState('');
  const [wallet, setWallet] = useState(props.wallet);

  return (
    <Dialog className="token-selector-dialog wallet-dialog" onClose={props.onClose}>
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
                  className={`token-list-item ${
                    wallet?.publicKey === t.publicKey ? 'selected-wallet' : ''
                  }`}
                  key={`toke-list-item-${t.mint}`}
                  onClick={() => {
                    setWallet(t);
                    props.onChange(t.publicKey)
                  }}
                >
                  <div className="left-side">
                    {' '}
                    <div className="name-container">
                      <div className="symbol">
                        <span className='truncate'>{t.alias}</span>
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
    </Dialog>
  );
};

export default SelectWalletDialog;
