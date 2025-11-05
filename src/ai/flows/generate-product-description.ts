'use server';

/**
 * @fileOverview AI flow to generate product descriptions for the Tlemcen Smart Supermarket.
 *
 * - generateProductDescription - A function that generates a product description.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product in French.'),
  productCategory: z.string().describe('The category of the product.'),
  productDetails: z.string().describe('Additional details about the product.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description in French.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `Vous êtes un expert en rédaction pour un supermarché en ligne à Tlemcen, en Algérie. Votre tâche est de générer une description de produit convaincante et informative en français.

  Nom du produit: {{productName}}
  Catégorie de produit: {{productCategory}}
  Détails du produit: {{productDetails}}

  Rédigez une description de produit qui met en évidence les principales caractéristiques et avantages du produit, adaptée aux clients de Tlemcen. Assurez-vous que la description est attrayante et optimisée pour les ventes en ligne.
  Répondez au format JSON.
  {
    "description": ""
  }`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
