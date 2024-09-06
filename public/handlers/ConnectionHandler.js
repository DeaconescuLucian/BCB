"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ipcHandler_1 = require("../ipcHandler");
const events_1 = require("../events");
const connectionDb = __importStar(require("../database/connections"));
const connection_1 = require("../solana/connection");
const CreateConnectionHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.createConnectionEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        const valabileConnection = yield (0, connection_1.testConnection)(arg);
        return new Promise((resolve) => {
            if (valabileConnection)
                connectionDb.insertConnection(db, arg, (result) => {
                    resolve(result);
                });
            else
                resolve({ error: 'Invalid connection string;' });
        });
    }));
};
const GetConnectionsHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.getConnectionsEvent, () => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            connectionDb.getConnections(db, (err, rows) => __awaiter(void 0, void 0, void 0, function* () {
                if (err) {
                    reject(err);
                }
                else {
                    try {
                        const connections = yield Promise.all((rows === null || rows === void 0 ? void 0 : rows.map((row) => __awaiter(void 0, void 0, void 0, function* () {
                            return Object.assign({}, row);
                        }))) || []);
                        resolve(connections);
                    }
                    catch (error) {
                        reject(error);
                    }
                }
            }));
        });
    }));
};
const UpdateActiveConnectionHandler = (db, solanaConnection, mainWindow) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.updateActiveConnectionEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve) => {
            connectionDb.updateActiveConnection(db, arg, (result) => {
                if (!result) {
                    try {
                        (0, connection_1.updateSolanaConnection)(db, solanaConnection, mainWindow, arg);
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
                resolve(result);
            });
        });
    }));
};
const DeleteConnectionHandler = (db) => {
    (0, ipcHandler_1.registerHandler)(events_1.CustomEvents.deleteConnectionEvent, (e, arg) => __awaiter(void 0, void 0, void 0, function* () {
        return new Promise((resolve) => {
            connectionDb.deleteConnection(db, arg, (result) => {
                resolve(result);
            });
        });
    }));
};
const handleConnection = (db, solanaConnection, mainWindow) => {
    CreateConnectionHandler(db);
    GetConnectionsHandler(db);
    UpdateActiveConnectionHandler(db, solanaConnection, mainWindow);
    DeleteConnectionHandler(db);
};
exports.default = handleConnection;
