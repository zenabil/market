'use client';

import React, { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import type { Recipe, Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Clock, Users, Soup, ShoppingCart, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import StarRating from '@/components/product/star-rating';
import ProductReviews from '@/components/product/product-reviews';

function RecipeDetailsPage() {
    const { id: recipeId } = useParams();
    const firestore = useFirestore();
    const { addItem } = useCart();
    const { toast } = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const recipeRef = useMemoFirebase(() => {
        if (!firestore || !recipeId) return null;
        return doc(firestore, 'recipes', recipeId as string);
    }, [firestore, recipeId]);

    const { data: recipe, isLoading } = useDoc<Recipe>(recipeRef);

    const handleAddAllToCart = async () => {
        if (!firestore || !recipe?.ingredients || recipe.ingredients.length === 0) return;
        setIsAddingToCart(true);

        try {
            const productsToQuery = recipe.ingredients.map(name => name.toLowerCase()).slice(0, 30);
            if (productsToQuery.length === 0) {
                 toast({
                    variant: 'destructive',
                    title: 'Aucun ingrédient à rechercher',
                });
                setIsAddingToCart(false);
                return;
            }

            const productsRef = collection(firestore, 'products');
            const q = query(productsRef);
            const querySnapshot = await getDocs(q);
            const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            
            let itemsAddedCount = 0;
            const notFoundProducts: string[] = [];

            recipe.ingredients.forEach(ingredientName => {
                const foundProduct = allProducts.find(p => p.name.toLowerCase() === ingredientName.toLowerCase());
                if (foundProduct) {
                    addItem(foundProduct);
                    itemsAddedCount++;
                } else {
                    notFoundProducts.push(ingredientName);
                }
            });
    
            if (itemsAddedCount > 0) {
                toast({
                    title: 'Ingrédients ajoutés au panier',
                    description: `${itemsAddedCount} ingrédient(s) ont été ajoutés à votre panier.`
                });
            }
    
            if (notFoundProducts.length > 0) {
                 toast({
                    variant: 'destructive',
                    title: 'Certains ingrédients non trouvés',
                    description: `Nous n'avons pas pu trouver: ${notFoundProducts.join(', ')}`
                });
            }

        } catch (error) {
            console.error("Error adding recipe ingredients to cart:", error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Impossible d'ajouter les ingrédients au panier."
            });
        } finally {
            setIsAddingToCart(false);
        }
    };


    if (isLoading) {
        return (
            <div className="container py-8 md:py-12 max-w-4xl mx-auto">
                <Skeleton className="h-12 w-3/4 mb-4" />
                <Skeleton className="h-6 w-full mb-8" />
                <Skeleton className="aspect-video w-full rounded-lg mb-8" />
                <div className="grid md:grid-cols-3 gap-8">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <Separator className="my-8" />
                 <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-1"><Skeleton className="h-64" /></div>
                    <div className="md:col-span-2"><Skeleton className="h-96" /></div>
                </div>
            </div>
        );
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
                        ({recipe.reviewCount || 0} avis)
                    </span>
                </div>
                <p className="mt-4 text-center text-lg text-muted-foreground">{recipe.description}</p>
                
                <div className="relative aspect-video w-full rounded-lg overflow-hidden my-8">
                    <Image src={recipe.image} alt={recipe.title} fill className="object-cover" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-8">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Clock className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">Temps de prép.</p>
                        <p className="text-sm text-muted-foreground">{recipe.prepTime} min</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Soup className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">Temps de cuisson</p>
                        <p className="text-sm text-muted-foreground">{recipe.cookTime} min</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Clock className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">Temps Total</p>
                        <p className="text-sm text-muted-foreground">{totalTime} min</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <Users className="h-8 w-8 mx-auto text-primary" />
                        <p className="mt-2 font-semibold">Portions</p>
                        <p className="text-sm text-muted-foreground">{recipe.servings} pers.</p>
                    </div>
                </div>

                <Separator className="my-8" />
                
                <div className="grid md:grid-cols-3 gap-12">
                    <div className="md:col-span-1">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-headline text-2xl">Ingrédients</h2>
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
                            Ajouter les ingrédients au panier
                        </Button>
                    </div>
                    <div className="md:col-span-2">
                        <h2 className="font-headline text-2xl mb-4">Instructions</h2>
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
            <ProductReviews productId={recipeId} />
        </>
    )
}


export default function RecipePage() {
    return <RecipeDetailsPage />
}

    