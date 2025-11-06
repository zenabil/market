'use server';

/**
 * @fileOverview AI flow to analyze a user's shopping list text and extract product names.
 *
 * - analyzeShoppingList - Analyzes the text and returns a list of potential product names.
 * - AnalyzeShoppingListInput - The input type for the function.
 * - AnalyzeShoppingListOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeShoppingListInputSchema = z.object({
  listText: z.string().describe('The raw text of the user\'s shopping list, with items potentially on new lines or separated by commas.'),
});
export type AnalyzeShoppingListInput = z.infer<typeof AnalyzeShoppingListInputSchema>;

const AnalyzeShoppingListOutputSchema = z.object({
  products: z.array(z.string()).describe('A list of standardized product names extracted from the shopping list text. Example: "5 red apples" becomes "Pommes".'),
});
export type AnalyzeShoppingListOutput = z.infer<typeof AnalyzeShoppingListOutputSchema>;


export async function analyzeShoppingList(input: AnalyzeShoppingListInput): Promise<AnalyzeShoppingListOutput> {
  return analyzeShoppingListFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeShoppingListPrompt',
  input: { schema: AnalyzeShoppingListInputSchema },
  output: { schema: AnalyzeShoppingListOutputSchema },
  prompt: `You are an expert shopping assistant for "Tlemcen Smart Supermarket". Your task is to analyze a user's raw shopping list text and extract a clean list of product names from it.

The user's list is in French. Your output must also be in French.

- Ignore quantities, weights, and descriptive adjectives. For example, "2kg de pommes rouges" should become just "Pommes". "Un paquet de café" becomes "Café".
- Standardize the product names to be generic. For example, "Baguette tradition" should become "Baguette".
- Return only the product names.

User's shopping list:
{{{listText}}}

Extract the product names and return them in the specified JSON format.`,
});


const analyzeShoppingListFlow = ai.defineFlow(
  {
    name: 'analyzeShoppingListFlow',
    inputSchema: AnalyzeShoppingListInputSchema,
    outputSchema: AnalyzeShoppingListOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
