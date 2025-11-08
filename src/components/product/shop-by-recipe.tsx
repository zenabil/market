
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Recipe } from '@/lib/placeholder-data';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/language-provider';

interface ShopByRecipeProps {
  recipes: Recipe[];
}

export default function ShopByRecipe({ recipes }: ShopByRecipeProps) {
  const { t } = useLanguage();
  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline text-3xl md:text-4xl">{t('home.shopByRecipe')}</h2>
        <Button variant="ghost" asChild>
            <Link href="/recipes">
                {t('home.viewAll')} <ArrowRight className="mr-2 h-4 w-4" />
            </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <Link href={`/recipes/${recipe.slug}`} key={recipe.id} className="group">
            <Card className="overflow-hidden h-full">
                <CardContent className="p-0 relative">
                    <div className="aspect-square">
                         <Image
                            src={recipe.image}
                            alt={recipe.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                         <h3 className="absolute bottom-4 left-4 font-headline text-xl text-white drop-shadow-md">
                            {recipe.title}
                        </h3>
                    </div>
                </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
