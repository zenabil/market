import { config } from 'dotenv';
config();

import '@/ai/flows/generate-product-description.ts';
import '@/ai/flows/product-recommendations.ts';
import '@/ai/flows/ai-support-chatbot.ts';
import '@/ai/flows/generate-recipe-from-ingredients.ts';
import '@/ai/flows/analyze-shopping-list.ts';
