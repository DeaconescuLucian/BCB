import { generateWallet } from "../solana/wallet";

var interval: NodeJS.Timeout;

function startWalletProcess() {
  interval = setInterval(() => {
    const message = generateWallet().publicKey;
    if (process.send) {
      process.send(message);
    }
  }, 1000);
}

function stopWalletProcess() {
  if (interval) {
    clearInterval(interval);
  }
  process.exit(0);
}

process.on('message', (msg) => {
  if (msg === 'start') {
    startWalletProcess();
  } else if (msg === 'stop') {
    stopWalletProcess();
  }
});

if (process.send) {
    process.send('ready');
}