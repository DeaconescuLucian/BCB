import React, { useState } from 'react';
import Input from '../../../components/FormControls/Input.tsx';
import Button from '../../../components/FormControls/Button.tsx';
import Info from '../../../components/Info/index.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import { useToast } from '../../../contexts/ToastContext.tsx';
import { useDispatch } from "react-redux";
import { fetchWallets } from "../../../store/reducers/wallets.js";
import Loading from '../../../components/Loading/index.tsx';

function ImportWallet() {
  const { showToast } = useToast();
  const [secretKey, setSecretKey] = useState(null);
  const [walletAlias, setWalletAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleImportWallet = async () => {
    setLoading(true);
    const result = await window.electron.invoke(CustomEvents.importWalletEvent, {secretKey: secretKey, alias: walletAlias});
    if (result) {
      setLoading(false);
      if (result.data.message) {
        showToast(result.data.message, 'success');
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
      }
      dispatch(fetchWallets());
    }
  };

  const validateSecretKey = (value) => {
    return null;
  };

  const validateWalletAlias = (value) => {
    const errorMessage = 'Wallet alias must be between 3 and 20 characters long.';
    if(value.length < 3)
      return errorMessage;

    return null;
  };

  const onSecretKeyInputChange = (value) => {
    setSecretKey(value);
  };

  const onWalletAliasInputChange = (value) => {
    setWalletAlias(value);
  };

  return (
    <div className="import-wallet-page">
      <div className="import-wallet-page-container">
        <div className="label-with-copy">
          {' '}
          <span>Secret key: </span>
        </div>
        <Input type="text" validate={validateSecretKey} onChange={onSecretKeyInputChange} theme="primary" placeholder='Enter a valid secret key'></Input>
        <div className="label-with-copy">
          {' '}
          <span>Wallet alias: </span>
        </div>
        <Input type="text" validate={validateWalletAlias} onChange={onWalletAliasInputChange} theme="primary" placeholder='Enter an alias for your wallet'></Input>
        <Button
          onClick={() => {
            handleImportWallet();
          }}
          theme="primary"
          type="import-wallet"
          text="Import wallet"
          disabled={!!!secretKey  || !!!walletAlias}
          tooltipDisabled={'Enter a valid secret key and an wallet alias.'}
        ></Button>
      </div>
      <Info text="The secret key along with its public key will be stored locally."></Info>
      {loading  && <Loading></Loading>}
    </div>
  );
}

export default ImportWallet;
