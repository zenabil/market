'use client';

import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Recipe } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';

function RecipeCard({ recipe }: { recipe: Recipe }) {
    const { t, locale } = useLanguage();
    const totalTime = recipe.prepTime + recipe.cookTime;

    return (
        <Link href={`/recipes/${recipe.id}`} className="group">
            <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 h-full flex flex-col">
                <div className="aspect-video relative">
                    <Image
                        src={recipe.image}
                        alt={recipe.title[locale]}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
                <CardHeader>
                    <h3 className="font-headline text-xl font-semibold truncate">{recipe.title[locale]}</h3>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-sm line-clamp-3">{recipe.description[locale]}</p>
                     <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{t('recipes.total_time')} {totalTime} {t('recipes.minutes_short')}</span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}


export default function RecipesPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();

    const recipesQuery = useMemoFirebase(
        () => query(collection(firestore, 'recipes'), orderBy('title.en')),
        [firestore]
    );
    const { data: recipes, isLoading } = useCollection<Recipe>(recipesQuery);

    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">{t('recipes.title')}</h1>
                <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{t('recipes.subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading && Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-96 w-full" />
                ))}
                {recipes?.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
            </div>
             {!isLoading && recipes?.length === 0 && (
                <div className="text-center p-16 text-muted-foreground col-span-full">
                    <p className="text-lg">{t('recipes.no_recipes_found')}</p>
                </div>
            )}
        </div>
    );
}
