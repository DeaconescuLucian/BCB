import { registerHandler } from '../ipcHandler';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import { Connection } from '@solana/web3.js';
import { getTokenDetails, getTokenList, getTokenPrice } from '../solana/utils';
import * as tokenDb from '../database/tokens';

const GetTokenDetailsHandler = (solanaConnection: Connection) => {
  registerHandler(CustomEvents.getTokenDetailsEvent, async (e: any, arg: string) => {
    let response = await getTokenDetails(solanaConnection, arg);
    return new Promise((resolve) => {
      resolve(response);
    });
  });
};

const GetTokenPriceHandler = (solanaConnection: Connection) => {
  registerHandler(CustomEvents.getTokenPriceEvent, async (e: any, arg: string) => {
    let response = await getTokenPrice(arg);
    return new Promise((resolve) => {
      resolve(response);
    });
  });
};

const GetTokensHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getTokenList, async () => {
    console.log('Fetching fucking tokens');
    return new Promise((resolve, reject) => {
      tokenDb.getTokens(db, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const tokens = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            let response = await getTokenList();
            const tokensArray = [
              ...tokens,
              ...(response || []).map((e: any) => ({
                name: e.name,
                symbol: e.symbol,
                address: e.address,
                logoURI: e.logoURI,
              })),
            ];
            const tokensSet = new Set(tokensArray.map((e) => e.address));
            const uniqueTokensArray = Array.from(tokensSet).map((address) =>
              tokensArray.find((e) => e.address === address)
            );
            resolve(uniqueTokensArray);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  });
};

const AddTokenHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.addTokenEvent, async (e: any, arg: any) => {
    return new Promise((resolve, reject) => {
      tokenDb.insertTokens(db, [arg], (result) => {
        if (result.error) {
          reject(result.error);
        } else {
          resolve('token inserted successfully');
        }
      });
    });
  });
};

const handleToken = (db: sqlite3.Database, solanaConnection: Connection) => {
  GetTokenDetailsHandler(solanaConnection);
  GetTokenPriceHandler(solanaConnection);
  GetTokensHandler(db);
  AddTokenHandler(db);

};

export default handleToken;
