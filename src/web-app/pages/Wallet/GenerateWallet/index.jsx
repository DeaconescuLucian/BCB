import React, { useState } from 'react';
import Button from '../../../components/FormControls/Button.tsx';
import CopyToClipboard from '../../../components/CopyToClipboard/index.tsx';
import Info from '../../../components/Info/index.tsx';
import { useToast } from '../../../contexts/ToastContext.tsx';
import Input from '../../../components/FormControls/Input.tsx';
import { CustomEvents } from '../../../../ts/events.ts';
import { useDispatch } from "react-redux";
import { fetchWallets } from "../../../store/reducers/wallets.js";

function GenerateWallet() {
  const { showToast } = useToast();
  const [wallet, setWallet] = useState(null);
  const [walletSaved, setWalletSaved] = useState(false);
  const [walletAlias, setWalletAlias] = useState('');
  const dispatch = useDispatch();

  const saveWallet = async () => {
    const result = await window.electron.invoke(CustomEvents.saveWalletEvent, {wallet: wallet, alias: walletAlias});
    if (result) {
      if (result.data.message) {
        showToast(result.data.message, 'success');
        setWalletSaved(true);
      } else {
        if (result.data.error) {
          showToast(result.data.error, 'fail');
        }
      }
      setWallet(null);
      setWalletAlias('');
      dispatch(fetchWallets());
    }
  };

  const handleGenerateWallet = async () => {
    const result = await window.electron.invoke(CustomEvents.generateWalletEvent);
    if (result.data) {
      result.data.secretKey = Object.values(result.data.secretKey).join(',');
      setWallet(result.data);
      setWalletSaved(false);
    }
  };

  const validateWalletAlias = (value) => {
    const errorMessage = 'Wallet alias must be between 3 and 20 characters long.';
    if (value.length < 3) return errorMessage;

    return null;
  };

  const onWalletAliasInputChange = (value) => {
    setWalletAlias(value);
  };

  return (
    <div className="generate-wallet-page">
      {!wallet && (
        <div className="response">
          <div className="generated-wallet">
            <div className="label-with-copy">
              {' '}
              <span>Wallet alias: </span>
            </div>
            <Input
              type="text"
              validate={validateWalletAlias}
              onChange={onWalletAliasInputChange}
              theme="primary"
              placeholder='Enter an alias for your wallet'
            ></Input>
          </div>
          <div className="button-container">
            <Button
              onClick={() => {
                handleGenerateWallet();
              }}
              theme="primary"
              type="add"
              text="Generate"
              disabled={!!!walletAlias}
              tooltipDisabled='Choose an alias for the wallet.'
            ></Button>
          </div>
        </div>
      )}

      {wallet && (
        <>
          {' '}
          <div className="response">
          <div className="generated-wallet">
            <div className="label-with-copy">
              {' '}
              <span>Wallet alias: </span>
            </div>
            <Input
              type="text"
              readonly
              readOnlyValue={walletAlias}
              theme="primary"
              placeholder="Enter an alias for your wallet"
            ></Input>
          </div>
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
                  setWallet(null);
                  setWalletAlias('');
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
  );
}

export default GenerateWallet;
