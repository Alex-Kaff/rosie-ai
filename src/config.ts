// Configuration settings for the application
import * as dotenv from 'dotenv';

dotenv.config();

// OpenAI API Configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ChatGPT Configuration
export const CHATGPT_CONFIG = {
  model: "gpt-4.1-mini",
  temperature: 0.7
};