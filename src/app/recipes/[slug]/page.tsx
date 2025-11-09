

import React, { Suspense } from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { Recipe, Review } from '@/lib/placeholder-data';
import { WithContext, Recipe as RecipeSchema, BreadcrumbList, Review as ReviewSchema } from 'schema-dts';

const RecipeDetailsClient = dynamic(() => import('./recipe-details-client'), { ssr: false, loading: () => <RecipePageSkeleton /> });

// Server-side metadata generation
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const db = getFirestore();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const q = query(collection(db, 'recipes'), where('slug', '==', params.slug), limit(1));
  const recipeSnap = await getDocs(q);

  if (recipeSnap.empty) {
    return {
      title: 'Recipe Not Found',
    }
  }

  const recipeDoc = recipeSnap.docs[0];
  const recipe = { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;

  const previousImages = (await parent).openGraph?.images || []
  
    // Fetch latest 5 reviews for schema
  const reviewsQuery = query(collection(db, `recipes/${recipe.id}/reviews`), orderBy('createdAt', 'desc'), limit(5));
  const reviewsSnapshot = await getDocs(reviewsQuery);
  const reviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);

  const recipeJsonLd: WithContext<RecipeSchema> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: recipe.image,
    prepTime: `PT${recipe.prepTime}M`,
    cookTime: `PT${recipe.cookTime}M`,
    totalTime: `PT${recipe.prepTime + recipe.cookTime}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.instructions.map((instruction, index) => ({
      '@type': 'HowToStep',
      text: instruction,
    })),
     ...(recipe.reviewCount && recipe.reviewCount > 0 && recipe.averageRating ? {
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: recipe.averageRating.toFixed(1),
            reviewCount: recipe.reviewCount
        },
        review: reviews.map(review => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: review.userName },
            datePublished: review.createdAt,
            reviewBody: review.comment,
            reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating.toString()
            }
        } as ReviewSchema))
    } : {})
  };

  const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}` },
        { '@type': 'ListItem', position: 2, name: 'Recettes', item: `${baseUrl}/recipes` },
        { '@type': 'ListItem', position: 3, name: recipe.title, item: `${baseUrl}/recipes/${recipe.slug}` }
    ]
  };


  return {
    title: recipe.title,
    description: recipe.description.substring(0, 160),
    openGraph: {
      title: recipe.title,
      description: recipe.description.substring(0, 160),
      images: [
        {
          url: recipe.image,
          width: 1200,
          height: 630,
          alt: recipe.title,
        },
        ...previousImages,
      ],
    },
     twitter: {
      card: 'summary_large_image',
      title: recipe.title,
      description: recipe.description.substring(0, 160),
      images: [recipe.image],
    },
     alternates: {
        canonical: `/recipes/${recipe.slug}`,
    },
    other: {
      jsonLd: JSON.stringify([recipeJsonLd, breadcrumbJsonLd])
    }
  }
}

function RecipePageSkeleton() {
    return (
        <div className="container py-8 md:py-12 max-w-4xl mx-auto">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-8" />
            <Skeleton className="aspect-video w-full rounded-lg mb-8" />
            <div className="grid md:grid-cols-4 gap-4">
                <Skeleton className="h-24" />
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


export default function RecipePage({ params }: { params: { slug: string }}) {
    return (
        <Suspense fallback={<RecipePageSkeleton />}>
            <RecipeDetailsClient recipeSlug={params.slug} />
        </Suspense>
    );
}
