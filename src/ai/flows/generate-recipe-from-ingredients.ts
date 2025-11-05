'use server';

/**
 * @fileOverview AI flow to generate a recipe from a list of ingredients.
 *
 * - generateRecipeFromIngredients - A function that generates a complete recipe.
 * - GenerateRecipeFromIngredientsInput - The input type for the function.
 * - GenerateRecipeFromIngredientsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateRecipeFromIngredientsInputSchema = z.object({
  ingredients: z.string().describe('A comma-separated list of ingredients the user has.'),
  language: z.enum(['ar', 'en', 'fr']).describe('The desired output language for the recipe.'),
});
export type GenerateRecipeFromIngredientsInput = z.infer<typeof GenerateRecipeFromIngredientsInputSchema>;

const GenerateRecipeFromIngredientsOutputSchema = z.object({
  title: z.string().describe('The creative and appealing title of the generated recipe.'),
  description: z.string().describe('A brief, enticing description of the recipe.'),
  imagePrompt: z.string().describe('A prompt for an image generation model to create a picture of the final dish.'),
  prepTime: z.number().describe('The estimated preparation time in minutes.'),
  cookTime: z.number().describe('The estimated cooking time in minutes.'),
  servings: z.number().describe('The number of servings the recipe yields.'),
  ingredients: z.array(z.string()).describe('The full list of ingredients required for the recipe.'),
  instructions: z.array(z.string()).describe('The step-by-step instructions to prepare the dish.'),
  missingProducts: z.array(z.string()).describe('A list of products the user might need to buy for this recipe.'),
});
export type GenerateRecipeFromIngredientsOutput = z.infer<typeof GenerateRecipeFromIngredientsOutputSchema>;


export async function generateRecipeFromIngredients(
  input: GenerateRecipeFromIngredientsInput
): Promise<GenerateRecipeFromIngredientsOutput> {
  return generateRecipeFromIngredientsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateRecipeFromIngredientsPrompt',
  input: { schema: GenerateRecipeFromIngredientsInputSchema },
  output: { schema: GenerateRecipeFromIngredientsOutputSchema },
  prompt: `You are an expert chef for "Tlemcen Smart Supermarket", specializing in Algerian and Mediterranean cuisine. A user has the following ingredients: {{{ingredients}}}.

Your task is to create a delicious and creative recipe based on these ingredients. The recipe should be in {{language}}.

1.  **Analyze the ingredients:** Identify a suitable dish. If the ingredients are sparse, create a simple but elegant recipe. Feel free to add common pantry staples (like oil, salt, pepper, spices) and suggest a few additional key ingredients to make the dish complete.
2.  **Create a Title and Description:** Give the recipe a creative and appealing title and a short, enticing description.
3.  **List all ingredients:** Provide a complete list of all ingredients needed for the recipe, including the ones the user already has and any you've added.
4.  **Write Instructions:** Provide clear, step-by-step instructions.
5.  **Estimate Times and Servings:** Provide realistic estimates for prep time, cook time, and servings.
6.  **Identify Missing Products:** List the key ingredients you added that the user likely needs to buy. This list should only contain the names of products, e.g., ["Chicken breast", "Olive oil", "Tomatoes"].
7.  **Generate Image Prompt:** Create a descriptive prompt for an image generation model to create a picture of the final dish. Example: "A beautifully plated dish of Algerian Chicken Tagine with olives and preserved lemons, steam rising, on a rustic wooden table."

Respond in a structured JSON format. The response must be in {{language}}.`,
});


const generateRecipeFromIngredientsFlow = ai.defineFlow(
  {
    name: 'generateRecipeFromIngredientsFlow',
    inputSchema: GenerateRecipeFromIngredientsInputSchema,
    outputSchema: GenerateRecipeFromIngredientsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
