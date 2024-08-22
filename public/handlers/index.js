"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHandlers = setupHandlers;
const WalletHandler_1 = __importDefault(require("./WalletHandler"));
function setupHandlers(mainWindow, db) {
    (0, WalletHandler_1.default)(db);
}
