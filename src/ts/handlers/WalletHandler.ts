import { registerHandler } from '../ipcHandler';
import { importKeypair, generateWallet } from '../solana/wallet';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import * as walletDb from '../database/wallets';
import * as walletTokenAccountDb from '../database/walletTokenAccounts';
import { Connection, PublicKey } from '@solana/web3.js';
import { getSolanaBalance, getTokensOwnedByWallet } from '../solana/utils';
import { insertTokens, updateTokens } from '../database/tokens';
import {
  getWalletTokenAccounts,
  insertWalletTokenAccounts,
  updateTokenAccountBalances,
} from '../database/walletTokenAccounts';
import { updateWalletBalance } from '../database/wallets';
import { ITokenAccount, IToken } from '../solana/utils';

const ImportWalletHandler = (db: sqlite3.Database, solanaConnection: Connection) => {
  registerHandler(CustomEvents.importWalletEvent, async (e: any, arg: any) => {
    let response: any;
    try {
      response = importKeypair(arg.secretKey);
      const solBalance = await getSolanaBalance(solanaConnection, response.data?.keyPair.publicKey as PublicKey);
      return new Promise((resolve) => {
        walletDb.insertWallet(db, { wallet: response.data, alias: arg.alias, balance: solBalance }, (result: any) => {
          if (!result.error)
            getTokensOwnedByWallet(solanaConnection, new PublicKey(response.data?.publicKey)).then((res) => {
              insertTokens(db, res.tokens, (r) => {
                if (!r.error) {
                  insertWalletTokenAccounts(db, res.accounts, (r) => {
                    resolve(result);
                  });
                }
              });
            });
          else {
            resolve(result);
          }
        });
      });
    } catch (error) {
      return new Promise((resolve) => {
        resolve(response);
      });
    }
  });
};

const GenerateWalletHandler = () => {
  registerHandler(CustomEvents.generateWalletEvent, async () => {
    try {
      const response = generateWallet();
      return new Promise((resolve) => {
        resolve(response);
      });
    } catch (error) {
      console.error('Error in GenerateWalletHandler:', error);
      return 'error';
    }
  });
};

const SaveWalletHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.saveWalletEvent, async (e: any, arg: any) => {
    if (!arg.balance) arg.balance = 0;
    return new Promise((resolve) => {
      walletDb.insertWallet(db, arg, (result: any) => {
        resolve(result);
      });
    });
  });
};

const GetWalletsHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getWalletsEvent, async () => {
    return new Promise((resolve, reject) => {
      walletDb.getWallets(db, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const wallets = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(wallets);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  });
};

const UpdateWalletHandler = (db: sqlite3.Database, solanaConnection: Connection) => {
  registerHandler(CustomEvents.updateWalletEvent, async (e: any, arg: string) => {
    const publicKey = new PublicKey(arg);
    const solBalance = await getSolanaBalance(solanaConnection, publicKey);
    let error: string | undefined | null = null;
    await new Promise<void>((resolve, reject) => {
      updateWalletBalance(db, { publicKey: arg, balance: solBalance }, (err: Error | null) => {
        if (err) {
          error = err.message;
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await getTokensOwnedByWallet(solanaConnection, publicKey).then(async (res) => {
      const tokenAccs = await getWalletTokenAccounts(db, arg);
      let tokenAccsToInsert: ITokenAccount[] = [];
      let tokenAccsToUpdate: ITokenAccount[] = [];
      let tokensToInsert: IToken[] = [];
      let tokensToUpdate: IToken[] = [];

      res.accounts.forEach((acc) => {
        let token = res.tokens.find((t) => t.mint === acc.mint);
        if (tokenAccs?.find((a) => a.accountAddress === acc.accountAddress)) {
          tokenAccsToUpdate.push(acc);
          if (token) tokensToUpdate.push(token);
        } else {
          tokenAccsToInsert.push(acc);
          if (token) tokensToInsert.push(token);
        }
      });

      try {
        if (tokenAccsToInsert.length)
          await new Promise<void>((resolve, reject) => {
            insertTokens(db, tokensToInsert, (result) => {
              if (result.error) {
                error = result.error;
                reject(result.error);
              } else {
                resolve();
              }
            });
          });

        if (tokensToUpdate.length)
          await new Promise<void>((resolve, reject) => {
            updateTokens(db, tokensToUpdate, (err: Error | null) => {
              if (err) {
                error = err.message;
                reject(err.message);
              } else {
                resolve();
              }
            });
          });

        if (tokenAccsToInsert.length)
          await new Promise<void>((resolve, reject) => {
            insertWalletTokenAccounts(db, tokenAccsToInsert, (result) => {
              if (result.error) {
                error = result.error;
                reject(result.error);
              } else {
                resolve();
              }
            });
          });

        if (tokenAccsToUpdate.length)
          await new Promise<void>((resolve, reject) => {
            updateTokenAccountBalances(
              db,
              tokenAccsToUpdate.map((a) => {
                return { accountAddress: a.accountAddress, balance: a.amount };
              }),
              (err: Error | null) => {
                if (err) {
                  error = err.message;
                  reject(err.message);
                } else {
                  resolve();
                }
              }
            );
          });
      } catch (err) {
        console.error('An error occurred:', err);
      }
    });

    return new Promise((resolve) => {
      resolve(error);
    });
  });
};

const GetWalletDetailsHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getWalletDetailsEvent, async (e: any, arg: string) => {
    let details = await walletTokenAccountDb.getWalletTokenAccounts(db, arg);
    return new Promise((resolve) => {
      resolve(details);
    });
  });
};

const handleWallet = (db: sqlite3.Database, solanaConnection: Connection) => {
  ImportWalletHandler(db, solanaConnection);
  GenerateWalletHandler();
  SaveWalletHandler(db);
  GetWalletsHandler(db);
  UpdateWalletHandler(db, solanaConnection);
  GetWalletDetailsHandler(db);
};

export default handleWallet;
