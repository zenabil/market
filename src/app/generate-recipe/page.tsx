'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Wand2, Loader2, Clock, Users, Soup, Sparkles, ChefHat, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { generateRecipeFromIngredients, type GenerateRecipeFromIngredientsOutput } from '@/ai/flows/generate-recipe-from-ingredients';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';

const formSchema = z.object({
    ingredients: z.string().min(10, { message: 'Veuillez lister au moins quelques ingrédients.' }),
});


export default function GenerateRecipePage() {
    const { toast } = useToast();
    const { addItem } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [generatedRecipe, setGeneratedRecipe] = useState<GenerateRecipeFromIngredientsOutput | null>(null);

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
                name: productName,
                price: 100, // Placeholder price
                images: ['https://picsum.photos/seed/' + productName + '/400/400'],
                discount: 0,
                stock: 99,
                categoryId: 'ai-generated',
                description: '',
                sku: '',
                barcode: '',
                sold: 0,
            };
            addItem(mockProduct);
        });

        toast({
            title: 'Articles ajoutés au panier',
            description: 'Les ingrédients manquants ont été ajoutés à votre panier.'
        });
    };


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setGeneratedRecipe(null);
        try {
            const result = await generateRecipeFromIngredients({
                ingredients: values.ingredients,
            });
            setGeneratedRecipe(result);
        } catch (error) {
            console.error("Failed to generate recipe:", error);
            toast({
                variant: 'destructive',
                title: 'Échec de la génération',
                description: 'Impossible de générer une recette pour le moment.',
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
                    Générateur de Recettes IA
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">Vous ne savez pas quoi cuisiner ? Entrez les ingrédients que vous avez et laissez notre IA créer une recette délicieuse pour vous !</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Vos Ingrédients</CardTitle>
                    <CardDescription>Listez les ingrédients que vous avez, séparés par des virgules.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="ingredients"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ingrédients</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ex: tomates, poulet, oignon, huile d'olive..."
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
                                        Génération en cours...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Générer une recette
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
                            <p className="mt-2 font-semibold">Temps de prép.</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.prepTime} min</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <ChefHat className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">Temps de cuisson</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.cookTime} min</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <Soup className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">Temps Total</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.prepTime + generatedRecipe.cookTime} min</p>
                        </div>
                         <div className="p-4 bg-muted/50 rounded-lg">
                            <Users className="h-8 w-8 mx-auto text-primary" />
                            <p className="mt-2 font-semibold">Portions</p>
                            <p className="text-sm text-muted-foreground">{generatedRecipe.servings} pers.</p>
                        </div>
                    </div>
                    
                    <Separator className="my-8" />

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="md:col-span-1">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        Ingrédients
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
                                            Ingrédients manquants
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-1 list-disc pl-5 text-sm text-muted-foreground">
                                            {generatedRecipe.missingProducts.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                        <Button className="w-full mt-4" onClick={handleAddMissingToCart}>
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            Ajouter au panier
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="font-headline text-2xl mb-4">Instructions</h3>
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
                                Invite pour image IA
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
