import { registerHandler } from '../ipcHandler';
import { CustomEvents } from '../events';
import sqlite3 from 'sqlite3';
import * as poolFilterDb from '../database/lookup/poolFiltersLookup';


const GetPoolFiltersHandler = (db: sqlite3.Database) => {
  registerHandler(CustomEvents.getPoolFiltersEvent, async () => {
    return new Promise((resolve, reject) => {
      poolFilterDb.getPoolFilters(db, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const filters = await Promise.all(
              rows?.map(async (row: any) => {
                return {
                  ...row,
                };
              }) || []
            );
            resolve(filters);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  });
};

const handlePoolFilter = (db: sqlite3.Database) => {
    GetPoolFiltersHandler(db);
};

export default handlePoolFilter;
