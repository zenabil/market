
'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Wand2, Loader2, Clock, Users, Soup, Sparkles, ChefHat, ShoppingCart } from 'lucide-react';
import { generateRecipeFromIngredients, type GenerateRecipeFromIngredientsOutput } from '@/ai/flows/generate-recipe-from-ingredients';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { useLanguage } from '@/contexts/language-provider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Générateur de Recettes IA',
    description: 'Transformez les ingrédients que vous avez à la maison en une délicieuse recette grâce à notre assistant IA.',
};


export default function GenerateRecipePage() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { addItem } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState<GenerateRecipeFromIngredientsOutput | null>(null);
    const firestore = useFirestore();

    const formSchema = z.object({
        ingredients: z.string().min(10, { message: t('generateRecipe.validation.ingredients') }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ingredients: '',
        },
    });

    const handleAddMissingToCart = async () => {
        if (!firestore || !generatedRecipe || generatedRecipe.missingProducts.length === 0) return;
        setIsAddingToCart(true);
    
        try {
            const productNames = generatedRecipe.missingProducts;
            if (productNames.length === 0) return;
    
            // Firestore 'in' query is limited to 30 items, so we slice the array.
            const productsToQuery = productNames.slice(0, 30);
            const productsRef = collection(firestore, 'products');
            const q = query(productsRef, where('name', 'in', productsToQuery));
    
            const querySnapshot = await getDocs(q);
            const foundProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            const foundProductNames = foundProducts.map(p => p.name.toLowerCase());
            
            let itemsAddedCount = 0;
            foundProducts.forEach(product => {
                addItem(product);
                itemsAddedCount++;
            });
    
            if (itemsAddedCount > 0) {
                toast({
                    title: t('generateRecipe.toast.added.title'),
                    description: t('generateRecipe.toast.added.description').replace('{{count}}', itemsAddedCount.toString())
                });
            }
            
            const notFoundProducts = productNames.filter(
                name => !foundProductNames.includes(name.toLowerCase())
            );
    
            if (notFoundProducts.length > 0) {
                 toast({
                    variant: 'destructive',
                    title: t('generateRecipe.toast.notFound.title'),
                    description: `${t('generateRecipe.toast.notFound.description')}: ${notFoundProducts.join(', ')}`
                });
            }
    
        } catch (error) {
            console.error("Error adding missing products to cart:", error);
            toast({
                variant: 'destructive',
                title: t('dashboard.common.error'),
                description: t('generateRecipe.toast.error')
            });
        } finally {
            setIsAddingToCart(false);
        }
    };


    async function onSubmit(values: z.infer<typeof formSchema>>) {
        setIsLoading(true);
        setGeneratedRecipe(null);
        try {
            const result = await generateRecipeFromIngredients({
                ingredients: values.ingredients,
            });
            setGeneratedRecipe(result);
            toast({
                title: t('generateRecipe.toast.analysisComplete.title'),
                description: t('generateRecipe.toast.analysisComplete.description').replace('{{count}}', result.missingProducts.length.toString()),
            });
        } catch (error) {
            console.error("Failed to generate recipe:", error);
            toast({
                variant: 'destructive',
                title: t('generateRecipe.toast.generationFailed.title'),
                description: t('generateRecipe.toast.generationFailed.description'),
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-12 max-w-3xl mx-auto">
                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl flex items-center justify-center gap-4">
                    <Wand2 className="h-10 w-10 text-primary" />
                    {t('generateRecipe.title')}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">{t('generateRecipe.subtitle')}</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>{t('generateRecipe.yourIngredients.title')}</CardTitle>
                    <CardDescription>{t('generateRecipe.yourIngredients.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="ingredients"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('generateRecipe.yourIngredients.label')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('generateRecipe.yourIngredients.placeholder')}
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('generateRecipe.buttons.generating')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {t('generateRecipe.buttons.generate')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="mt-12 max-w-4xl mx-auto">
                     <Skeleton className="h-[600px] w-full" />
                </div>
            )}

            {generatedRecipe && (
                 <div className="mt-12 max-w-4xl mx-auto animate-in fade-in-50 duration-500">
                     <div className="relative aspect-video w-full rounded-lg overflow-hidden my-8 bg-muted">
                        <Image src={generatedRecipe.imageUrl} alt={generatedRecipe.title} fill className="object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                         <div className="absolute bottom-0 left-0 p-8 text-white">
                            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl drop-shadow-md">{generatedRecipe.title}</h2>
                            <p className="mt-2 max-w-xl text-neutral-200 drop-shadow">{generatedRecipe.description}</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <Clock className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipe.prepTime')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.prepTime} min</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <ChefHat className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipe.cookTime')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.cookTime} min</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <Soup className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipe.totalTime')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.prepTime + generatedRecipe.cookTime} min</p>
                        </div>
                         <div className="p-4 bg-muted/50 rounded-lg">
                            <Users className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipe.servings')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.servings} {t('recipe.people')}</p>
                        </div>
                    </div>
                    
                    <Separator className="my-8" />

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="md:col-span-1">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        {t('recipe.ingredients')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                                        {generatedRecipe.ingredients.map((ingredient, index) => (
                                            <li key={index}>{ingredient}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                            {generatedRecipe.missingProducts && generatedRecipe.missingProducts.length > 0 && (
                                 <Card className="mt-4 bg-primary/10 border-primary/50">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {t('generateRecipe.missingIngredients.title')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-1 list-disc pl-5 text-sm text-muted-foreground">
                                            {generatedRecipe.missingProducts.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                        <Button className="w-full mt-4" onClick={handleAddMissingToCart} disabled={isAddingToCart}>
                                            {isAddingToCart && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            {t('generateRecipe.buttons.addToCart')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="font-headline text-2xl mb-4">{t('recipe.instructions')}</h3>
                            <div className="space-y-4 prose prose-neutral dark:prose-invert max-w-none">
                                {generatedRecipe.instructions.map((instruction, index) => (
                                    <div key={index} className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">{index + 1}</div>
                                        <p className="mt-1">{instruction}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}
