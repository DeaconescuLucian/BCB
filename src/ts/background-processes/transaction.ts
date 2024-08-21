import { generateWallet } from "../solana/wallet";

var interval: NodeJS.Timeout;

function generateRandomNumber() {
    const randomNum = Math.random() * 10;
    const roundedNum = randomNum.toFixed(8);
    return parseFloat(roundedNum);
}

function getRandomStatus() {
    const statuses = ['success', 'fail', 'pending'];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex];
}

function startTransactionProcess() {
  interval = setInterval(() => {
    const signature = generateWallet().pub;
    const date = new Date();
    const value = generateRandomNumber();
    const status = getRandomStatus();
    if (process.send) {
      process.send({
        signature,
        date,
        value,
        status
      });
    }
  }, 60000);
}

function stopTransactionProcess() {
  if (interval) {
    clearInterval(interval);
  }
  process.exit(0);
}

process.on('message', (msg) => {
  if (msg === 'start') {
    startTransactionProcess();
  } else if (msg === 'stop') {
    stopTransactionProcess();
  }
});

if (process.send) {
    process.send('ready');
}