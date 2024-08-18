import React, { useState, useEffect } from 'react';
import Button from '../../components/FormControls/Button.tsx';
import CopyToClipboard from '../../components/CopyToClipboard/index.tsx';
import Page from '../../components/Page/index.tsx';

function GenerateWallet() {
  const [wallet, setWallet] = useState(null);
  const [walletSaved, setWalletSaved] = useState(false);

  const saveWallet = () => {
    var wallets = localStorage.getItem('wallets');

    if (!wallets) wallets = [];
    else wallets = JSON.parse(wallets);

    wallets.push(wallet.kp);
    localStorage.setItem('wallets', JSON.stringify(wallets));
    setWalletSaved(true);
    //TODO: hide the save button until a new wallet is generated
  };

  useEffect(() => {
    const unsubscribe = window.electron.on('wallet-generated', (msg) => {
      let wlt = JSON.parse(msg);
      wlt.secret = Object.values(wlt.secret).join(',');
      setWallet(wlt);
      setWalletSaved(false);
    });

    return unsubscribe;
  }, []);

  const handleGenerateWallet = async () => {
    await window.electron.invoke('generate-wallet');
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
          <div className="response">
            <div className="generated-wallet">
              <div className="label-with-copy">
                {' '}
                <span>Wallet Address: </span>
                <CopyToClipboard text={wallet.pub}></CopyToClipboard>
              </div>

              <input type="text" value={wallet.pub} readOnly />
            </div>
            <div className="generated-wallet">
              <div className="label-with-copy">
                {' '}
                <span>Secret key: </span>
                <CopyToClipboard text={wallet.secret}></CopyToClipboard>
              </div>
              <input type="text" value={wallet.secret} readOnly />
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
          </div>
        )}
      </div>
    </Page>
  );
}

export default GenerateWallet;
