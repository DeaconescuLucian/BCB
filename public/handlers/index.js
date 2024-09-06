"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHandlers = setupHandlers;
const WalletHandler_1 = __importDefault(require("./WalletHandler"));
const ConnectionHandler_1 = __importDefault(require("./ConnectionHandler"));
const TokenHandler_1 = __importDefault(require("./TokenHandler"));
const TransactionHandler_1 = __importDefault(require("./TransactionHandler"));
function setupHandlers(db, solanaConnection, mainWindow) {
    (0, WalletHandler_1.default)(db, solanaConnection);
    (0, ConnectionHandler_1.default)(db, solanaConnection, mainWindow);
    (0, TokenHandler_1.default)(db, solanaConnection);
    (0, TransactionHandler_1.default)(db, solanaConnection, mainWindow);
}
