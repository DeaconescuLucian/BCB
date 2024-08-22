import React, { useState, useEffect } from 'react';
import Button from '../../components/FormControls/Button.tsx';
import CopyToClipboard from '../../components/CopyToClipboard/index.tsx';
import Page from '../../components/Page/index.tsx';
import Info from '../../components/Info/index.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import Input from '../../components/FormControls/Input.tsx';
import { CustomEvents } from '../../../ts/events.ts'

function GenerateWallet() {
  const { showToast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [walletSaved, setWalletSaved] = useState(false);

  const saveWallet = async () => {
    const result = await window.electron.invoke(CustomEvents.saveWalletEvent, wallet);
    if (result) {
      if(result.data.message)
      {
        showToast(result.data.message, 'success');
        setWalletSaved(true);
      }
      else {
        if(result.data.error)
        {
          showToast(result.data.error, 'fail');
        }
      }
    }
  };

  const handleGenerateWallet = async () => {
    const result = await window.electron.invoke(CustomEvents.generateWalletEvent);
    if(result.data)
    {
      result.data.secretKey = Object.values(result.data.secretKey).join(',');
      setWallet(result.data);
      setWalletSaved(false);
    }
  };

  return (
    <Page>
      <div className="generate-wallet-page">
        {!wallet && (
            <Button
              onClick={() => {
                handleGenerateWallet();
              }}
              theme="primary"
              type="add"
              text="Generate"
            ></Button>
        )}

        {wallet && (
          <>
            {' '}
            <div className="response">
              <div className="generated-wallet">
                <div className="label-with-copy">
                  {' '}
                  <span>Wallet Address: </span>
                  <CopyToClipboard text={wallet.publicKey}></CopyToClipboard>
                </div>

                <Input type="text" theme="primary" readOnly readOnlyValue={wallet.publicKey}></Input>
              </div>
              <div className="generated-wallet">
                <div className="label-with-copy">
                  {' '}
                  <span>Secret key: </span>
                  <CopyToClipboard text={wallet.secretKey}></CopyToClipboard>
                </div>
                <Input type="text" theme="primary" readOnly readOnlyValue={wallet.secretKey}></Input>
              </div>
              <div className="buttons-container-end-of-block two-buttons">
                <Button
                  onClick={() => {
                    handleGenerateWallet();
                  }}
                  theme="primary"
                  type="add"
                  text="Generate new"
                ></Button>
                {!walletSaved && (
                  <Button
                    onClick={() => {
                      saveWallet();
                    }}
                    theme="secondary"
                    type="save"
                    text="Save locally"
                  ></Button>
                )}
              </div>
            </div>{' '}
            <Info text="The secret key along with its public key will be stored locally."></Info>
          </>
        )}
      </div>
    </Page>
  );
}

export default GenerateWallet;
