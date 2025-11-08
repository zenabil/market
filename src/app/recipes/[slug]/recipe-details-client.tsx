

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { notFound } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, doc, getDocs, query, where, limit } from 'firebase/firestore';
import type { Recipe, Product } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Clock, Users, Soup, ShoppingCart, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import StarRating from '@/components/product/star-rating';
import { useLanguage } from '@/contexts/language-provider';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ReviewsSection = dynamic(() => import('@/components/shared/reviews-section'), {
    loading: () => <div className="container py-12"><Skeleton className="h-64 w-full" /></div>
});

export default function RecipeDetailsClient({ recipeSlug }: { recipeSlug: string }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { addItem } = useCart();
    const { toast } = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRecipe = useCallback(async () => {
        if (!firestore || !recipeSlug) return;

        setIsLoading(true);
        const recipesRef = collection(firestore, 'recipes');
        const q = query(recipesRef, where('slug', '==', recipeSlug), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const recipeDoc = querySnapshot.docs[0];
            setRecipe({ id: recipeDoc.id, ...recipeDoc.data() } as Recipe);
        } else {
            setRecipe(null);
        }
        setIsLoading(false);
    }, [firestore, recipeSlug]);
    
    useEffect(() => {
        fetchRecipe();
    }, [fetchRecipe]);

    const handleAddAllToCart = async () => {
        if (!firestore || !recipe?.ingredients || recipe.ingredients.length === 0) return;
        setIsAddingToCart(true);

        try {
            const productsToQuery = recipe.ingredients.slice(0, 30);
            if (productsToQuery.length === 0) {
                 toast({
                    variant: 'destructive',
                    title: t('recipe.noIngredients'),
                });
                setIsAddingToCart(false);
                return;
            }

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
                    title: t('recipe.addedToCart.title'),
                    description: t('recipe.addedToCart.description').replace('{{count}}', itemsAddedCount.toString())
                });
            }
    
            const notFoundProducts = productsToQuery.filter(
                ingredientName => !foundProductNames.some(foundName => foundName.toLowerCase() === ingredientName.toLowerCase())
            );

            if (notFoundProducts.length > 0) {
                 toast({
                    variant: 'destructive',
                    title: t('recipe.notFound.title'),
                    description: `${t('recipe.notFound.description')}: ${notFoundProducts.join(', ')}`
                });
            }

        } catch (error) {
            console.error("Error adding recipe ingredients to cart:", error);
            toast({
                variant: 'destructive',
                title: t('dashboard.common.error'),
                description: t('recipe.error')
            });
        } finally {
            setIsAddingToCart(false);
        }
    };


    if (isLoading) {
        return null; // The parent suspense will handle the skeleton
    }
    
    if (!recipe) {
        return notFound();
    }
    
    const totalTime = recipe.prepTime + recipe.cookTime;

    return (
        <>
            <div className="container py-8 md:py-12 max-w-4xl mx-auto">
                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-center">{recipe.title}</h1>
                <div className="mt-4 flex items-center justify-center gap-2">
                    <StarRating rating={recipe.averageRating || 0} />
                    <span className="text-sm text-muted-foreground">
                        ({recipe.reviewCount || 0} {t('recipe.reviews')})
                    </span>
                </div>
                <p className="mt-4 text-center text-lg text-muted-foreground">{recipe.description}</p>
                
                <div className="relative aspect-video w-full rounded-lg overflow-hidden my-8">
                    <Image src={recipe.image} alt={recipe.title} fill className="object-cover" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Clock className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">{t('recipe.prepTime')}</p>
                        <p className="text-sm text-muted-foreground">{recipe.prepTime} min</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Soup className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">{t('recipe.cookTime')}</p>
                        <p className="text-sm text-muted-foreground">{recipe.cookTime} min</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Clock className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">{t('recipe.totalTime')}</p>
                        <p className="text-sm text-muted-foreground">{totalTime} min</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Users className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">{t('recipe.servings')}</p>
                        <p className="text-sm text-muted-foreground">{recipe.servings} {t('recipe.people')}</p>
                    </div>
                </div>

                <Separator className="my-8" />
                
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="md:col-span-1">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-headline text-2xl">{t('recipe.ingredients')}</h2>
                        </div>
                        <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                            {recipe.ingredients.map((ingredient, index) => (
                                <li key={index}>{ingredient}</li>
                            ))}
                        </ul>
                        <Button className="w-full mt-6" onClick={handleAddAllToCart} disabled={isAddingToCart}>
                            {isAddingToCart ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ShoppingCart className="mr-2 h-4 w-4" />
                            )}
                            {t('recipe.addToCart')}
                        </Button>
                    </div>
                    <div className="md:col-span-2">
                        <h2 className="font-headline text-2xl mb-4">{t('recipe.instructions')}</h2>
                        <div className="space-y-4 prose prose-neutral dark:prose-invert max-w-none">
                            {recipe.instructions.map((instruction, index) => (
                                <div key={index} className="flex gap-4 items-start">
                                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">{index + 1}</div>
                                    <p className="mt-1">{instruction}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <ReviewsSection targetId={recipe.id} targetCollection="recipes" onReviewChange={fetchRecipe} />
        </>
    )
}
