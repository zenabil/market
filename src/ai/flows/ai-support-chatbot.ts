'use server';

/**
 * @fileOverview Implements a chatbot to answer user questions about the supermarket.
 *
 * - aiSupportChatbot - A function that handles the chatbot interaction.
 * - AISupportChatbotInput - The input type for the aiSupportChatbot function.
 * - AISupportChatbotOutput - The return type for the aiSupportChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AISupportChatbotInputSchema = z.object({
  question: z.string().describe('The user\s question about the supermarket.'),
});
export type AISupportChatbotInput = z.infer<typeof AISupportChatbotInputSchema>;

const AISupportChatbotOutputSchema = z.object({
  answer: z.string().describe('The chatbot\s answer to the user\s question.'),
});
export type AISupportChatbotOutput = z.infer<typeof AISupportChatbotOutputSchema>;

export async function aiSupportChatbot(input: AISupportChatbotInput): Promise<AISupportChatbotOutput> {
  return aiSupportChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSupportChatbotPrompt',
  input: {schema: AISupportChatbotInputSchema},
  output: {schema: AISupportChatbotOutputSchema},
  prompt: `You are a chatbot for Tlemcen Smart Supermarket. Answer the following question about the supermarket:

{{question}}

Keep your answers concise and helpful.`,
});

const aiSupportChatbotFlow = ai.defineFlow(
  {
    name: 'aiSupportChatbotFlow',
    inputSchema: AISupportChatbotInputSchema,
    outputSchema: AISupportChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
