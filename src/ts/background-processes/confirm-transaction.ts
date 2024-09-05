import { Connection } from '@solana/web3.js';
import { createConnection } from '../solana/utils';
import { confirmTransaction } from '../solana/transactions';

let data;
let connection: Connection;

async function startConfirmTransactionProcess(data: {
  connection: string;
  transactionData: {
    signature: string;
    block: string;
    amount: number;
  };
}) {
  console.log(data);
  console.log('Confirm transaction started');
  connection = createConnection(data.connection);
  const response = await confirmTransaction(connection, {
    block: data.transactionData.block,
    signature: data.transactionData.signature,
  });
  if (response)
    if (process.send) {
      process.send({
        type: 'transaction-confirmation-done',
        data: {
          signature: response.signature,
          status: response.status,
          date: response.date,
          value: data.transactionData.amount,
        },
      });
    }

  stopTransactionProcess();
}

function stopTransactionProcess() {
  console.log('Stopped confirm transaction');
  process.exit(0);
}

process.on('message', (msg: any) => {
  if (msg.type === 'start') {
    startConfirmTransactionProcess(msg.data);
  }
});

console.log('Sending ready message from conifrm-transaction process');
if (process.send) {
  process.send('ready');
}
