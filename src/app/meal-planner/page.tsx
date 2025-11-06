'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Sparkles, Loader2, Salad, Beef, ShoppingCart } from 'lucide-react';
import { generateWeeklyMealPlan, type WeeklyMealPlan } from '@/ai/flows/generate-weekly-meal-plan';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  diet: z.string().optional(),
  people: z.coerce.number().min(1, 'Il doit y avoir au moins 1 personne.'),
});

export default function MealPlannerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      people: 2,
      diet: 'balanced',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMealPlan(null);
    toast({
      title: 'Génération en cours...',
      description: 'Veuillez patienter pendant que nous préparons votre plan de repas personnalisé.',
    });
    try {
      const result = await generateWeeklyMealPlan(values);
      setMealPlan(result);
    } catch (error) {
      console.error("Failed to generate meal plan:", error);
      toast({
        variant: 'destructive',
        title: 'Échec de la génération',
        description: 'Impossible de générer un plan de repas pour le moment.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const weekDays = mealPlan ? Object.keys(mealPlan).filter(k => k !== 'shoppingList') : [];

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl flex items-center justify-center gap-4">
          <CalendarDays className="h-10 w-10 text-primary" />
          Planificateur de Repas IA
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Laissez notre IA créer un plan de repas personnalisé pour votre semaine, avec une liste de courses prête à l'emploi.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Vos Préférences</CardTitle>
          <CardDescription>Aidez-nous à personnaliser votre plan de repas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="diet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régime Alimentaire</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisissez un régime" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="balanced">Équilibré</SelectItem>
                          <SelectItem value="vegetarian">Végétarien</SelectItem>
                          <SelectItem value="low-calorie">Peu calorique</SelectItem>
                          <SelectItem value="mediterranean">Méditerranéen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="people"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de personnes</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Générer mon plan de repas
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
        {isLoading && (
            <div className="mt-12 grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2"><Skeleton className="h-96" /></div>
                <div><Skeleton className="h-96" /></div>
            </div>
        )}

      {mealPlan && (
        <div className="mt-12 grid lg:grid-cols-3 gap-8 animate-in fade-in-50 duration-500">
            <div className="lg:col-span-2">
                 <h2 className="font-headline text-3xl mb-4">Votre Plan de la Semaine</h2>
                 <Tabs defaultValue={weekDays[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
                        {weekDays.map(day => (
                            <TabsTrigger key={day} value={day} className="capitalize">{day.substring(0,3)}</TabsTrigger>
                        ))}
                    </TabsList>
                    {weekDays.map(day => (
                        <TabsContent key={day} value={day}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="capitalize font-headline text-2xl">{day}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2"><Salad className="h-5 w-5 text-primary"/> Déjeuner</h3>
                                        <p className="text-muted-foreground pl-7">{(mealPlan as any)[day].lunch}</p>
                                    </div>
                                     <Separator />
                                     <div>
                                        <h3 className="font-semibold flex items-center gap-2"><Beef className="h-5 w-5 text-primary"/> Dîner</h3>
                                        <p className="text-muted-foreground pl-7">{(mealPlan as any)[day].dinner}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
            <div>
                 <h2 className="font-headline text-3xl mb-4 flex items-center gap-2">
                    <ShoppingCart className="h-7 w-7"/> Liste de Courses
                 </h2>
                 <Card>
                    <CardContent className="pt-6 space-y-4 max-h-[500px] overflow-y-auto">
                        {mealPlan.shoppingList.map((category, index) => (
                            <div key={index}>
                                <h4 className="font-bold text-lg">{category.category}</h4>
                                <ul className="list-disc list-inside pl-2 mt-2 space-y-1 text-muted-foreground">
                                    {category.items.map((item, itemIndex) => (
                                        <li key={itemIndex}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                 </Card>
            </div>
        </div>
      )}
    </div>
  );
}
