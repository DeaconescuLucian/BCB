import sqlite3  from "sqlite3";
import * as dataCollectProcess from "./dataCollectProcess";
import * as dataCollectPools from "./dataCollectPools";
import * as dataCollectPoolFilters from "./dataCollectPoolFilters";
import * as dataCollectPoolPrices from "./dataCollectPoolPrices";

export async function createDataCollectSchema(db: sqlite3.Database): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.serialize(async () => {
            try {
                //create commands
                await dataCollectProcess.createDataCollectProcess(db);
                await dataCollectPools.createTableDataCollectPools(db);
                await dataCollectPoolFilters.createTableDataCollectProcessPoolFilters(db);
                await dataCollectPoolPrices.createTableDataCollectPoolPrices(db);
                //insert commands
                await dataCollectProcess.insertDataCollectProcesses(db);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
}