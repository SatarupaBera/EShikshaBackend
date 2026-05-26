import { funcWrapper } from "../util/wraperFunction.js";
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export const getChatResponse = funcWrapper(async (req, res)=>{
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config:{
            systemInstruction:`Give ansewer within 10 words`
        }
    });

    res.json({ reply: response.text });
})