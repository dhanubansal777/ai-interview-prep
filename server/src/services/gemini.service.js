import '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    responseMimeType: 'application/json',
  },
});

export const callGemini = async (prompt, maxRetries = 3) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      const msg = err.message || '';
      const isRetryable = msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand');

      if (!isRetryable || attempt === maxRetries) {
        console.error('Gemini API error:', msg);
        throw new Error('AI service failed. Please try again.');
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = 2000 * attempt;
      console.log(`⏳ Retry ${attempt}/${maxRetries} after ${delay}ms (model overloaded)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
};