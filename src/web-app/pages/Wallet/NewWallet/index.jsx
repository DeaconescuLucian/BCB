import React from 'react';
import ImportWallet from '../ImportWallet';
import GenerateWallet from '../GenerateWallet';

function NewWallet() {

  return (
    <div className="new-wallet-page">
        <div className="half-page"><div className="title">Generate Wallet</div><GenerateWallet></GenerateWallet></div>
        <div className="half-page"><div className="title">Import Wallet</div><ImportWallet></ImportWallet></div>
    </div>
  );
}

export default NewWallet;
