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
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { useCart } from '@/hooks/use-cart';
import { useLanguage } from '@/contexts/language-provider';

export default function MealPlannerPage() {
  const { t } = useLanguage();
  const formSchema = z.object({
    diet: z.string().optional(),
    people: z.coerce.number().min(1, t('mealPlanner.validation.people')),
  });
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const firestore = useFirestore();
  const { addItem } = useCart();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      people: 2,
      diet: 'balanced',
    },
  });

  const handleAddAllToCart = async () => {
    if (!firestore || !mealPlan?.shoppingList) return;
    setIsAddingToCart(true);

    const allItems = mealPlan.shoppingList.flatMap(category => category.items.map(item => item.toLowerCase()));
    if (allItems.length === 0) {
        setIsAddingToCart(false);
        return;
    }

    try {
        const productsRef = collection(firestore, 'products');
        const q = query(productsRef);
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

        const foundProducts: Product[] = [];
        allItems.forEach(itemName => {
            const found = allProducts.find(p => p.name.toLowerCase() === itemName);
            if (found) {
                foundProducts.push(found);
            }
        });
        
        const foundProductNames = foundProducts.map(p => p.name.toLowerCase());
        
        let itemsAddedCount = 0;
        foundProducts.forEach(product => {
            addItem(product);
            itemsAddedCount++;
        });

        if (itemsAddedCount > 0) {
            toast({
                title: t('mealPlanner.toast.added.title'),
                description: t('mealPlanner.toast.added.description').replace('{{count}}', itemsAddedCount.toString())
            });
        }
        
        const notFoundProducts = allItems.filter(name => !foundProductNames.includes(name));

        if (notFoundProducts.length > 0) {
             toast({
                variant: 'destructive',
                title: t('mealPlanner.toast.notFound.title'),
                description: `${t('mealPlanner.toast.notFound.description')}: ${notFoundProducts.join(', ')}`
            });
        }

    } catch (error) {
        console.error("Error adding all items to cart:", error);
        toast({
            variant: 'destructive',
            title: t('dashboard.common.error'),
            description: t('mealPlanner.toast.error')
        });
    } finally {
        setIsAddingToCart(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMealPlan(null);
    toast({
      title: t('mealPlanner.toast.generating.title'),
      description: t('mealPlanner.toast.generating.description'),
    });
    try {
      const result = await generateWeeklyMealPlan(values);
      setMealPlan(result);
    } catch (error) {
      console.error("Failed to generate meal plan:", error);
      toast({
        variant: 'destructive',
        title: t('mealPlanner.toast.failed.title'),
        description: t('mealPlanner.toast.failed.description'),
      });
    } finally {
      setIsLoading(false);
    }
  }

  const weekDays = mealPlan ? Object.keys(mealPlan).filter(k => k !== 'shoppingList') : [];
  const dayTranslations: { [key: string]: string } = {
    monday: t('mealPlanner.days.monday'),
    tuesday: t('mealPlanner.days.tuesday'),
    wednesday: t('mealPlanner.days.wednesday'),
    thursday: t('mealPlanner.days.thursday'),
    friday: t('mealPlanner.days.friday'),
    saturday: t('mealPlanner.days.saturday'),
    sunday: t('mealPlanner.days.sunday'),
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12 max-w-3xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl flex items-center justify-center gap-4">
          <CalendarDays className="h-10 w-10 text-primary" />
          {t('mealPlanner.title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t('mealPlanner.subtitle')}
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('mealPlanner.preferences.title')}</CardTitle>
          <CardDescription>{t('mealPlanner.preferences.description')}</CardDescription>
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
                      <FormLabel>{t('mealPlanner.preferences.diet')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('mealPlanner.preferences.dietPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="balanced">{t('mealPlanner.diets.balanced')}</SelectItem>
                          <SelectItem value="vegetarian">{t('mealPlanner.diets.vegetarian')}</SelectItem>
                          <SelectItem value="low-calorie">{t('mealPlanner.diets.lowCalorie')}</SelectItem>
                          <SelectItem value="mediterranean">{t('mealPlanner.diets.mediterranean')}</SelectItem>
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
                      <FormLabel>{t('mealPlanner.preferences.people')}</FormLabel>
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
                    {t('mealPlanner.buttons.generating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('mealPlanner.buttons.generate')}
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
                 <h2 className="font-headline text-3xl mb-4">{t('mealPlanner.yourPlan')}</h2>
                 <Tabs defaultValue={weekDays[0]} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 md:grid-cols-7">
                        {weekDays.map(day => (
                            <TabsTrigger key={day} value={day} className="capitalize">{dayTranslations[day].substring(0,3)}</TabsTrigger>
                        ))}
                    </TabsList>
                    {weekDays.map(day => (
                        <TabsContent key={day} value={day}>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="capitalize font-headline text-2xl">{dayTranslations[day]}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold flex items-center gap-2"><Salad className="h-5 w-5 text-primary"/> {t('mealPlanner.lunch')}</h3>
                                        <p className="text-muted-foreground pl-7">{(mealPlan as any)[day].lunch}</p>
                                    </div>
                                     <Separator />
                                     <div>
                                        <h3 className="font-semibold flex items-center gap-2"><Beef className="h-5 w-5 text-primary"/> {t('mealPlanner.dinner')}</h3>
                                        <p className="text-muted-foreground pl-7">{(mealPlan as any)[day].dinner}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <h2 className="font-headline text-3xl flex items-center gap-2">
                        <ShoppingCart className="h-7 w-7"/> {t('mealPlanner.shoppingList')}
                    </h2>
                     <Button size="sm" onClick={handleAddAllToCart} disabled={isAddingToCart}>
                        {isAddingToCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShoppingCart className="mr-2 h-4 w-4"/>}
                         {t('mealPlanner.buttons.addAllToCart')}
                     </Button>
                 </div>
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
