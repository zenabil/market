'use client';

import React from 'react';
import { notFound, useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Recipe } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Clock, Users, Soup } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

function RecipeDetailsPage() {
    const { id: recipeId } = useParams();
    const firestore = useFirestore();

    const recipeRef = useMemoFirebase(() => {
        if (!firestore || !recipeId) return null;
        return doc(firestore, 'recipes', recipeId as string);
    }, [firestore, recipeId]);

    const { data: recipe, isLoading } = useDoc<Recipe>(recipeRef);

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
    
    return (
        <div className="container py-8 md:py-12 max-w-4xl mx-auto">
            <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl text-center">{recipe.title}</h1>
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
                    <Clock className="h-8 w-8 mx-auto text-primary" />
                    <p className="mt-2 font-semibold">Temps de cuisson</p>
                    <p className="text-sm text-muted-foreground">{recipe.cookTime} min</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto text-primary" />
                    <p className="mt-2 font-semibold">Portions</p>
                    <p className="text-sm text-muted-foreground">{recipe.servings} pers.</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <Soup className="h-8 w-8 mx-auto text-primary" />
                    <p className="mt-2 font-semibold">Temps Total</p>
                    <p className="text-sm text-muted-foreground">{recipe.prepTime + recipe.cookTime} min</p>
                </div>
            </div>

            <Separator className="my-8" />
            
            <div className="grid md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                    <h2 className="font-headline text-2xl mb-4">Ingrédients</h2>
                    <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                        {recipe.ingredients.map((ingredient, index) => (
                            <li key={index}>{ingredient}</li>
                        ))}
                    </ul>
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
    )
}


export default function RecipePage() {
    return <RecipeDetailsPage />
}
