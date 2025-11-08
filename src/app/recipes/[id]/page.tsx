

'use client';

import React, { Suspense } from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const RecipeDetailsClient = dynamic(() => import('./recipe-details-client'), { ssr: false });

// Server-side metadata generation
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const db = getFirestore();
  const recipeRef = doc(db, 'recipes', params.id);
  const recipeSnap = await getDoc(recipeRef);

  if (!recipeSnap.exists()) {
    return {
      title: 'Recipe Not Found',
    }
  }

  const recipe = recipeSnap.data();
  const previousImages = (await parent).openGraph?.images || []

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


export default function RecipePage({ params }: { params: { id: string }}) {
    return (
        <Suspense fallback={<RecipePageSkeleton />}>
            <RecipeDetailsClient recipeId={params.id} />
        </Suspense>
    );
}
