'use server';

/**
 * @fileOverview AI flow to generate product descriptions for the Tlemcen Smart Supermarket.
 *
 * - generateProductDescription - A function that generates product descriptions.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productNameAr: z.string().describe('The name of the product in Arabic.'),
  productNameFr: z.string().describe('The name of the product in French.'),
  productNameEn: z.string().describe('The name of the product in English.'),
  productCategory: z.string().describe('The category of the product.'),
  productDetails: z.string().describe('Additional details about the product.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  descriptionAr: z.string().describe('The generated product description in Arabic.'),
  descriptionFr: z.string().describe('The generated product description in French.'),
  descriptionEn: z.string().describe('The generated product description in English.'),
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
  prompt: `You are an expert copywriter for an online supermarket in Tlemcen, Algeria. Your task is to generate compelling and informative product descriptions in Arabic, French, and English.

  Product Name (Arabic): {{productNameAr}}
  Product Name (French): {{productNameFr}}
  Product Name (English): {{productNameEn}}
  Product Category: {{productCategory}}
  Product Details: {{productDetails}}

  Write a product description that highlights the key features and benefits of the product, tailored to customers in Tlemcen. Ensure the descriptions are engaging and optimized for online sales.
  Respond in JSON format.
  {
    "descriptionAr": "",
    "descriptionFr": "",
    "descriptionEn": ""
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
