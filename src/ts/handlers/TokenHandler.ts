import { registerHandler } from '../ipcHandler';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import { Connection } from '@solana/web3.js';
import { getTokenDetails, getTokenPrice } from '../solana/utils';

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

const handleToken = (db: sqlite3.Database, solanaConnection: Connection) => {
  GetTokenDetailsHandler(solanaConnection);
  GetTokenPriceHandler(solanaConnection);
};

export default handleToken;
