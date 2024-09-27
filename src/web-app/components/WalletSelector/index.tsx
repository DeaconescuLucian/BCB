import React, { useState, useEffect, useRef } from 'react';
import { downSvg } from '../../assets/svg';
import Dialog from '../Dialog';
import { crossSvg, addSvg, starSvg, emptyStarSvg } from '../../assets/svg';
import SearchBar from '../SearchBar';
import DefaultCoin from '../../assets/icons/coin.png';
import CopyToClipboard from '../CopyToClipboard';
import Loading from '../Loading';
import SelectWalletDialog from '../Menu/SelectWalletDialog';

interface IWalletSelector {
  onChange: Function;
  initialWallet: IWallet | null;
  walletList: IWallet[];
  hasRemoteSearch: boolean;
  readOnly?: boolean;
}

interface IWallet {
  publicKey: string;
  alias: string;
}

const WalletSelector = ({ onChange, initialWallet, walletList, hasRemoteSearch, readOnly }: IWalletSelector) => {
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(initialWallet);
  const [showDialog, setShowDialog] = useState(false);
  const [filter, setFilter] = useState('');

  const getWalletAbreviation = (wlt) => {
    const words = wlt.alias.split(' ');
    if (words.length > 1) return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
    else return words[0].charAt(0).toUpperCase();
  };

  useEffect(() => {
    setWallet(initialWallet);
  }, [initialWallet])

  return (
    <>
      <div
        className="wallet-selector"
        onClick={() => {
          if (!readOnly) setShowDialog(true);
        }}
      >
        <div className="alias-icon-container">{wallet && getWalletAbreviation(wallet)}</div>
        {downSvg}
      </div>
      {showDialog && (
        <SelectWalletDialog
          onClose={() => {
            setShowDialog(false);
          }}
          onChange={(pub) => {
            setWallet(walletList.find((w) => w.publicKey === pub) || null);
            onChange(walletList.find((w) => w.publicKey === pub) || null);
          }}
          wallet={wallet}
        ></SelectWalletDialog>
      )}
    </>
  );
};

export default WalletSelector;
