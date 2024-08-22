import React, { useEffect, useState } from 'react';
import Page from '../../components/Page/index.tsx';
import Input from '../../components/FormControls/Input.tsx';
import Button from '../../components/FormControls/Button.tsx';
import Info from '../../components/Info/index.tsx';
import { CustomEvents } from '../../../ts/events.ts';
import { useToast } from '../../contexts/ToastContext.tsx';

function ImportWallet() {
  const { showToast } = useToast();
  const [secretKey, setSecretKey] = useState(null);

  const handleImportWallet = async () => {
    const result = await window.electron.invoke(CustomEvents.importWalletEvent, secretKey);
    if (result) {
      if(result.data.message)
      {
        showToast(result.data.message, 'success');
      }
      else {
        if(result.data.error)
        {
          showToast(result.data.error, 'fail');
        }
      }
    }
  };

  const validateInput = (value) => {
    const numbers = value.split(',');
    const errorMessage = 'Invalid secret key! ( Make sure your secret key contains 64 numbers separated by comma. )';
    if (numbers.length !== 64) {
      return errorMessage;
    }
    for (let num of numbers) {
      if (isNaN(num) || num.trim() === '') {
        return errorMessage;
      }
    }

    return null;
  };

  const onInputChange = (value) => {
    setSecretKey(value);
  };

  return (
    <Page>
      <div className="import-wallet-page">
        <div className="import-wallet-page-container">
          <div className="label-with-copy">
            {' '}
            <span>Secret key: </span>
          </div>
          <Input type="text" validate={validateInput} onChange={onInputChange} theme="primary"></Input>
          <Button
            onClick={() => {
              handleImportWallet();
            }}
            theme="primary"
            type="import-wallet"
            text="Import wallet"
            disabled={!!!secretKey}
            tooltipDisabled={'Enter a valid secret key.'}
          ></Button>
        </div>
        <Info text="The secret key along with its public key will be stored locally."></Info>
      </div>
    </Page>
  );
}

export default ImportWallet;
