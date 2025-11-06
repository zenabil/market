'use server';

/**
 * @fileOverview AI flow to generate a weekly meal plan based on user preferences.
 *
 * - generateWeeklyMealPlan - Generates a 7-day meal plan with a shopping list.
 * - GenerateWeeklyMealPlanInput - Input type for the function.
 * - WeeklyMealPlan - Output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateWeeklyMealPlanInputSchema = z.object({
  diet: z.string().optional().describe('The user\'s dietary preference (e.g., balanced, vegetarian, low-calorie).'),
  people: z.coerce.number().min(1).describe('The number of people the meal plan is for.'),
});
export type GenerateWeeklyMealPlanInput = z.infer<typeof GenerateWeeklyMealPlanInputSchema>;

const DailyPlanSchema = z.object({
  lunch: z.string().describe('The suggested meal for lunch.'),
  dinner: z.string().describe('The suggested meal for dinner.'),
});

const WeeklyMealPlanSchema = z.object({
  monday: DailyPlanSchema,
  tuesday: DailyPlanSchema,
  wednesday: DailyPlanSchema,
  thursday: DailyPlanSchema,
  friday: DailyPlanSchema,
  saturday: DailyPlanSchema,
  sunday: DailyPlanSchema,
  shoppingList: z.array(z.object({
      category: z.string().describe('The category of the shopping list items (e.g., "Légumes", "Viandes", "Produits laitiers").'),
      items: z.array(z.string()).describe('The list of items to buy in that category.'),
  })).describe('A consolidated and categorized shopping list for the entire week.'),
});
export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlanSchema>;


export async function generateWeeklyMealPlan(input: GenerateWeeklyMealPlanInput): Promise<WeeklyMealPlan> {
  return generateWeeklyMealPlanFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateWeeklyMealPlanPrompt',
  input: { schema: GenerateWeeklyMealPlanInputSchema },
  output: { schema: WeeklyMealPlanSchema },
  prompt: `Vous êtes un expert nutritionniste et chef pour le "Supermarché Intelligent de Tlemcen". Votre tâche est de créer un plan de repas hebdomadaire (déjeuner et dîner pour 7 jours) et une liste de courses complète et catégorisée.

Préférences de l'utilisateur :
- Nombre de personnes : {{{people}}}
- Régime alimentaire : {{{diet}}}

Instructions :
1.  **Créer un plan de repas varié :** Pour chaque jour de la semaine (Lundi à Dimanche), proposez une idée de repas pour le déjeuner et le dîner. Les repas doivent être simples, sains et adaptés à la cuisine méditerranéenne/algérienne.
2.  **Générer une liste de courses :** Créez une liste de courses unique et consolidée pour TOUS les ingrédients nécessaires pour préparer TOUS les repas du plan hebdomadaire.
3.  **Catégoriser la liste de courses :** Organisez la liste de courses par catégories (par exemple : Légumes, Fruits, Viandes, Poissons, Produits laitiers, Épicerie, Boulangerie). C'est très important pour l'expérience utilisateur.

Assurez-vous que la réponse est entièrement en français et respecte le format JSON spécifié.`,
});


const generateWeeklyMealPlanFlow = ai.defineFlow(
  {
    name: 'generateWeeklyMealPlanFlow',
    inputSchema: GenerateWeeklyMealPlanInputSchema,
    outputSchema: WeeklyMealPlanSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
