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
});
export type GenerateRecipeFromIngredientsInput = z.infer<typeof GenerateRecipeFromIngredientsInputSchema>;

const GenerateRecipeFromIngredientsOutputSchema = z.object({
  title: z.string().describe('The creative and appealing title of the generated recipe in French.'),
  description: z.string().describe('A brief, enticing description of the recipe in French.'),
  imagePrompt: z.string().describe('A prompt for an image generation model to create a picture of the final dish.'),
  prepTime: z.number().describe('The estimated preparation time in minutes.'),
  cookTime: z.number().describe('The estimated cooking time in minutes.'),
  servings: z.number().describe('The number of servings the recipe yields.'),
  ingredients: z.array(z.string()).describe('The full list of ingredients required for the recipe in French.'),
  instructions: z.array(z.string()).describe('The step-by-step instructions to prepare the dish in French.'),
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
  prompt: `Vous êtes un chef expert pour le "Supermarché Intelligent de Tlemcen", spécialisé dans la cuisine algérienne et méditerranéenne. Un utilisateur dispose des ingrédients suivants: {{{ingredients}}}.

Votre tâche est de créer une recette délicieuse et créative à partir de ces ingrédients. La recette doit être en français.

1.  **Analysez les ingrédients:** Identifiez un plat approprié. Si les ingrédients sont rares, créez une recette simple mais élégante. N'hésitez pas à ajouter des produits de base courants (comme l'huile, le sel, le poivre, les épices) et à suggérer quelques ingrédients clés supplémentaires pour compléter le plat.
2.  **Créez un titre et une description:** Donnez à la recette un titre créatif et attrayant ainsi qu'une description courte et alléchante.
3.  **Listez tous les ingrédients:** Fournissez une liste complète de tous les ingrédients nécessaires pour la recette, y compris ceux que l'utilisateur possède déjà et ceux que vous avez ajoutés.
4.  **Rédigez les instructions:** Fournissez des instructions claires, étape par étape.
5.  **Estimez les temps et les portions:** Fournissez des estimations réalistes pour le temps de préparation, le temps de cuisson et le nombre de portions.
6.  **Identifiez les produits manquants:** Listez les ingrédients clés que vous avez ajoutés et que l'utilisateur devra probablement acheter. Cette liste ne doit contenir que les noms des produits, par exemple : ["Poitrine de poulet", "Huile d'olive", "Tomates"].
7.  **Générez une invite d'image:** Créez une invite descriptive pour qu'un modèle de génération d'images puisse créer une image du plat final. Exemple : "Un plat de tajine de poulet algérien magnifiquement présenté avec des olives et des citrons confits, de la vapeur s'en dégageant, sur une table en bois rustique."

Répondez dans un format JSON structuré. La réponse doit être en français.`,
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
