// import sqlite3 from 'sqlite3';
// import { Connection, PublicKey } from '@solana/web3.js';
// import { createConnection, getSolanaBalance } from '../solana/utils';
// import { getWallets, updateWalletBalance } from '../database/wallets';
// import { openConnection } from '../database/db';

// var interval: NodeJS.Timeout;
// let db: sqlite3.Database;
// let solana: Connection;

// async function getWalletsData() {
//   return new Promise<void>((resolve) => {
//     getWallets(db, async (err, rows?: any[]) => {
//       if (err) {
//         if (process.send) {
//           process.send({ err: err.message });
//         }
//         resolve();
//       } else {
//         if (rows) {
//           try {
//             const newRows = await Promise.all(
//               rows.map(async (r) => {
//                 try {
//                   const solBalance = (await getSolanaBalance(solana, new PublicKey(r.publicKey)));
//                   if (solBalance !== r.balance) {
//                     updateWalletBalance(db, { publicKey: r.publicKey, balance: solBalance });
//                   }
//                   return {
//                     ...r,
//                     balance: Math.random().toFixed(8),
//                   };
//                 } catch (balanceErr) {
//                   console.error('Error fetching Solana balance:', balanceErr);
//                   return {
//                     ...r,
//                     balance: 'Error',
//                   };
//                 }
//               })
//             );

//             if (process.send) process.send(newRows);
//           } catch (mapErr) {
//             console.error('Error processing rows:', mapErr);
//           }
//         }
//         resolve();
//       }
//     });
//   });
// }

// async function startWalletProcess() {
//   while (true) {
//     console.log('Getting wallets data from background process...');
//     await getWalletsData();
//     await new Promise((resolve) => setTimeout(resolve, 10000));
//   }
// }

// function stopWalletProcess() {
//   if (interval) {
//     db.close();
//     clearInterval(interval);
//   }
//   process.exit(0);
// }

// process.on('message', (msg: any) => {
//   if (msg.type === 'init') {
//     db = openConnection();
//     solana = createConnection();
//   } else if (msg === 'start') {
//     startWalletProcess();
//   } else if (msg === 'stop') {
//     stopWalletProcess();
//   }
// });

// if (process.send) {
//   process.send('ready');
// }
