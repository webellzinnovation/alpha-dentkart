import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import logger from '../utils/logger';

export async function chatWithAI(req: Request, res: Response) {
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

        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: context || 'You are a helpful assistant.',
            },
        });

        const result = await chat.sendMessage({ message });

        return res.json({ response: result.text });
    } catch (error: any) {
        logger.error('AI Error:', error);
        return res.status(500).json({ error: 'AI service error' });
    }
}
