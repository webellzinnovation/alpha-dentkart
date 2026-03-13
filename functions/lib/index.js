"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const server_1 = __importDefault(require("./server"));
exports.api = (0, https_1.onRequest)({
    region: "asia-south1",
    timeoutSeconds: 300,
    memory: "1GiB",
    invoker: "public"
}, server_1.default);
//# sourceMappingURL=index.js.map