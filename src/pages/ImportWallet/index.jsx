import React, {useEffect, useState} from 'react';
import Page from "../../components/Page/index.tsx";
import { importKeypair } from '../../ts/solana/wallet';

function ImportWallet() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribe = window.electron.on('started-watching-wallet', (msg) => {
      setMessage(msg);
    });

    return unsubscribe;
  }, []);

  const handleWalletWatch = async () => {
    // var key = importKeypair('209,109,21,95,197,211,87,15,247,87,148,53,230,242,21,251,14,235,249,44,8,188,142,219,198,153,143,92,156,147,75,192,27,53,210,83,201,208,5,168,74,128,64,68,130,153,117,117,231,0,9,15,177,170,149,205,222,158,26,134,164,17,212,27');
    // setMessage(key?.pub)
    const response = await window.electron.invoke('watch-wallet', '209,109,21,95,197,211,87,15,247,87,148,53,230,242,21,251,14,235,249,44,8,188,142,219,198,153,143,92,156,147,75,192,27,53,210,83,201,208,5,168,74,128,64,68,130,153,117,117,231,0,9,15,177,170,149,205,222,158,26,134,164,17,212,27');
  }

  return (
    <div className='main-container'>
      <h2>Import Wallet Page</h2>
      <Page>
        <button onClick={handleWalletWatch}>Watch Wallet</button>
        <span>{message}</span>
      </Page>
    </div>
  );
}

export default ImportWallet;