import sqlite3  from "sqlite3";
import * as poolFilters from './poolFiltersLookup';
import * as trackProcessSettings from './trackProcessSettingsLookup';
import * as trackProcessType from './trackProcessType';
import * as trackProcessTypeSettings from './trackProcessTypeSettings';
import * as dataCollectPoolFilters from "./dataCollectPoolFiltersLookup";

export async function createLookups(db: sqlite3.Database): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        db.serialize(async () => {
            try {
                //create commands
                await poolFilters.createTablePoolFiltersLookup(db);
                await dataCollectPoolFilters.createTablePoolFiltersLookup(db);
                await trackProcessSettings.createTableTrackProcessSettingsLookup(db);
                await trackProcessType.createTableTrackProcessType(db);
                await trackProcessTypeSettings.createTableTrackProcessTypeSettings(db);
                //insert commands
                await poolFilters.insertTrackProcessPoolFiltersLookupValues(db);
                await dataCollectPoolFilters.insertDataCollectPoolFiltersLookupValues(db);
                await trackProcessSettings.insertTrackProcessSettingsLookupValues(db);
                await trackProcessType.insertTrackProcessTypes(db);
                await trackProcessTypeSettings.insertTrackProcessTypeSettings(db);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    });
}