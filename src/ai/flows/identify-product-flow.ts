'use server';
/**
 * @fileOverview An AI agent for identifying products from an image.
 *
 * - identifyProduct - A function that handles the product identification process.
 * - IdentifyProductInput - The input type for the identifyProduct function.
 * - IdentifyProductOutput - The return type for the identifyProduct function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyProductInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The user-provided description or question about the product.'),
});
export type IdentifyProductInput = z.infer<typeof IdentifyProductInputSchema>;

const IdentifyProductOutputSchema = z.object({
  identification: z.object({
    isProduct: z.boolean().describe('Whether or not the image contains a recognizable product.'),
    commonName: z.string().describe('The common name of the identified product (e.g., "Tomato", "Coca-Cola Can").'),
  }),
});
export type IdentifyProductOutput = z.infer<typeof IdentifyProductOutputSchema>;

export async function identifyProduct(input: IdentifyProductInput): Promise<IdentifyProductOutput> {
  return identifyProductFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyProductPrompt',
  input: {schema: IdentifyProductInputSchema},
  output: {schema: IdentifyProductOutputSchema},
  prompt: `You are an expert at identifying products from an image for a supermarket. Your task is to identify the main product in the image.

Respond with the most common, generic name for the product. For example, if you see a can of "Coca-Cola Classic", respond with "Coca-Cola". If you see a "Red Delicious Apple", respond with "Apple".

If the image does not contain a recognizable product, set 'isProduct' to false and 'commonName' to "Unknown".

Use the following as the primary source of information.

Description: {{{description}}}
Photo: {{media url=photoDataUri}}`,
});

const identifyProductFlow = ai.defineFlow(
  {
    name: 'identifyProductFlow',
    inputSchema: IdentifyProductInputSchema,
    outputSchema: IdentifyProductOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
