import sqlite3  from "sqlite3";
import * as trackProcess from "./trackProcess";
import * as trackProcessPools from "./trackProcessPools";
import * as trackProcessPoolFilters from "./trackProcessPoolFilters";
import * as trackProcessPositions from "./trackProcessPositions";
import * as trackProcessSettings from "./trackProcessSettings";
import * as trackProcessTransactions from "./trackProcessTransactions";

export async function createTrackProcessSchema(db: sqlite3.Database): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.serialize(async () => {
            try {
                await trackProcess.createTableTrackProcess(db);
                await trackProcessPools.createTableTrackProcessPools(db);
                await trackProcessPoolFilters.createTableTrackProcessPoolFilters(db);
                await trackProcessPositions.createTableTrackProcessPositions(db);
                await trackProcessSettings.createTableTrackProcessSettings(db);
                await trackProcessTransactions.createTableTrackProcessTransactions(db);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
}