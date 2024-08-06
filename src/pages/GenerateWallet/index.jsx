import React, { useState, useEffect } from "react";
import { generateWallet } from "../../solana/wallet.ts";
import Button from "../../components/FormControls/Button.tsx";
import CopyToClipboard from "../../components/CopyToClipboard/index.tsx";
import Page from "../../components/Page/index.tsx";

function GenerateWallet() {
  const [wallet, setWallet] = useState(null);

  const saveWallet = () => {
    var wallets = localStorage.getItem("wallets");

    if (!wallets) wallets = [];
    else wallets = JSON.parse(wallets);

    wallets.push(wallet);
    localStorage.setItem("wallets", JSON.stringify(wallets));
  };

  return (
    <Page>
      <div className="generate-wallet-page">
        {!wallet && (
          <Button
            onClick={() => {
              setWallet(generateWallet());
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
                {" "}
                <span>Wallet Address: </span>
                <CopyToClipboard value={wallet.pub}></CopyToClipboard>
              </div>

              <input type="text" value={wallet.pub} readOnly />
            </div>
            <div className="generated-wallet">
              <div className="label-with-copy">
                {" "}
                <span>Secret key: </span>
                <CopyToClipboard value={wallet.secret.toString()}></CopyToClipboard>
              </div>
              <input type="text" value={wallet.secret.toString()} readOnly />
            </div>
            <div className="buttons-container-end-of-block two-buttons">
              <Button
                onClick={() => {
                  setWallet(generateWallet());
                }}
                theme="primary"
                type="add"
                text="Generate new"
              ></Button>
              <Button
                onClick={() => {
                  saveWallet();
                }}
                theme="secondary"
                type="save"
                text="Save locally"
              ></Button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}

export default GenerateWallet;
