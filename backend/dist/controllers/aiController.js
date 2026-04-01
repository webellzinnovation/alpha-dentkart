"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAI = chatWithAI;
const genai_1 = require("@google/genai");
const logger_1 = __importDefault(require("../utils/logger"));
async function chatWithAI(req, res) {
    try {
        const { message, context } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        // API key is server-side only - never exposed to client
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'AI service not configured' });
        }
        const ai = new genai_1.GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: context || 'You are a helpful assistant.',
            },
        });
        const result = await chat.sendMessage({ message });
        res.json({ response: result.text });
    }
    catch (error) {
        logger_1.default.error('AI Error:', error);
        res.status(500).json({ error: 'AI service error' });
    }
}
//# sourceMappingURL=aiController.js.map