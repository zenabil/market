'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useLanguage } from '@/hooks/use-language';
import { Wand2, Loader2, Clock, Users, Soup, Sparkles, ChefHat, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { generateRecipeFromIngredients, type GenerateRecipeFromIngredientsOutput } from '@/ai/flows/generate-recipe-from-ingredients';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';

const getFormSchema = (t: (key: string) => string) => z.object({
    ingredients: z.string().min(10, { message: t('generate_recipe.ingredients_required') }),
});


export default function GenerateRecipePage() {
    const { t, locale } = useLanguage();
    const { toast } = useToast();
    const { addItem } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState<GenerateRecipeFromIngredientsOutput | null>(null);

    const formSchema = getFormSchema(t);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ingredients: '',
        },
    });

    const handleAddMissingToCart = () => {
        if (!generatedRecipe?.missingProducts) return;

        // This is a simplified implementation. A real-world scenario would involve
        // searching for product IDs based on the names and adding the correct product objects.
        generatedRecipe.missingProducts.forEach(productName => {
            const mockProduct = {
                id: `ai-${productName.replace(/\s+/g, '-')}`,
                name: { ar: productName, fr: productName, en: productName },
                price: 100, // Placeholder price
                images: ['https://picsum.photos/seed/' + productName + '/400/400'],
                discount: 0,
                stock: 99,
                categoryId: 'ai-generated',
                description: { ar: '', fr: '', en: '' },
                sku: '',
                barcode: '',
                sold: 0,
            };
            addItem(mockProduct);
        });

        toast({
            title: t('generate_recipe.items_added_to_cart'),
            description: t('generate_recipe.items_added_to_cart_desc')
        });
    };


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setGeneratedRecipe(null);
        try {
            const result = await generateRecipeFromIngredients({
                ingredients: values.ingredients,
                language: locale,
            });
            setGeneratedRecipe(result);
        } catch (error) {
            console.error("Failed to generate recipe:", error);
            toast({
                variant: 'destructive',
                title: t('dashboard.generation_failed_title'),
                description: t('dashboard.generation_failed_desc'),
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
                    {t('generate_recipe.title')}
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">{t('generate_recipe.subtitle')}</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>{t('generate_recipe.form_title')}</CardTitle>
                    <CardDescription>{t('generate_recipe.form_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="ingredients"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('generate_recipe.ingredients_label')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('generate_recipe.ingredients_placeholder')}
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
                                        {t('generate_recipe.generating_button')}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {t('generate_recipe.generate_button')}
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
                        <Image src={`https://picsum.photos/seed/${generatedRecipe.title.replace(/\s+/g, '-')}/1280/720`} alt={generatedRecipe.title} fill className="object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                         <div className="absolute bottom-0 left-0 p-8 text-white">
                            <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl drop-shadow-md">{generatedRecipe.title}</h2>
                            <p className="mt-2 max-w-xl text-neutral-200 drop-shadow">{generatedRecipe.description}</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <Clock className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipes.prep_time')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.prepTime} {t('recipes.minutes_short')}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <ChefHat className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipes.cook_time')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.cookTime} {t('recipes.minutes_short')}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <Soup className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipes.total_time_label')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.prepTime + generatedRecipe.cookTime} {t('recipes.minutes_short')}</p>
                        </div>
                         <div className="p-4 bg-muted/50 rounded-lg">
                            <Users className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">{t('recipes.servings')}</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.servings} {t('recipes.people_short')}</p>
                        </div>
                    </div>
                    
                    <Separator className="my-8" />

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="md:col-span-1">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        {t('recipes.ingredients')}
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
                            {generatedRecipe.missingProducts.length > 0 && (
                                 <Card className="mt-4 bg-primary/10 border-primary/50">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {t('generate_recipe.missing_ingredients')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-1 list-disc pl-5 text-sm text-muted-foreground">
                                            {generatedRecipe.missingProducts.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                        <Button className="w-full mt-4" onClick={handleAddMissingToCart}>
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            {t('generate_recipe.add_to_cart')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="font-headline text-2xl mb-4">{t('recipes.instructions')}</h3>
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
                     <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5"/>
                                {t('generate_recipe.image_prompt_title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground italic p-4 bg-muted rounded-md font-mono">{generatedRecipe.imagePrompt}</p>
                        </CardContent>
                     </Card>
                 </div>
            )}
        </div>
    );
}
