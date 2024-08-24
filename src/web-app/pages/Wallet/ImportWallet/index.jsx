import React, { useState } from 'react';
import Page from '../../../components/Page/index.tsx';
import Input from '../../../components/FormControls/Input.tsx';
import Button from '../../../components/FormControls/Button.tsx';
import Info from '../../../components/Info/index.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import { useToast } from '../../../contexts/ToastContext.tsx';

function ImportWallet() {
  const { showToast } = useToast();
  const [secretKey, setSecretKey] = useState(null);
  const [walletAlias, setWalletAlias] = useState('');

  const handleImportWallet = async () => {
    const result = await window.electron.invoke(CustomEvents.importWalletEvent, {secretKey: secretKey, alias: walletAlias});
    if (result) {
      if (result.data.message) {
        showToast(result.data.message, 'success');
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
      }
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
        <Input type="text" validate={validateSecretKey} onChange={onSecretKeyInputChange} theme="primary"></Input>
        <div className="label-with-copy">
          {' '}
          <span>Wallet alias: </span>
        </div>
        <Input type="text" validate={validateWalletAlias} onChange={onWalletAliasInputChange} theme="primary"></Input>
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
    </div>
  );
}

export default ImportWallet;
