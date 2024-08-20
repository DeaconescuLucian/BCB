"use strict";
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
exports.registerHandler = registerHandler;
exports.sendToRenderer = sendToRenderer;
const electron_1 = require("electron");
const handlers = {};
function registerHandler(channel, handler) {
    if (handlers[channel]) {
        console.warn(`Handler for channel "${channel}" already exists. Overwriting.`);
        electron_1.ipcMain.removeAllListeners(channel);
    }
    handlers[channel] = handler;
    electron_1.ipcMain.on(channel, (event, ...args) => __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield handler(event, ...args);
            event.reply(`${channel}-response`, { success: true, data: result });
        }
        catch (error) {
            event.reply(`${channel}-response`, { success: false, error: error.message });
        }
    }));
}
function sendToRenderer(window, channel, ...args) {
    if (window) {
        if (channel)
            window.webContents.send(channel, ...args);
    }
}
