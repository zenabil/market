

'use client';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ProductGrid from '@/components/product/product-grid';
import { useCategories } from '@/hooks/use-categories';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import type { Product, Category } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-provider';
import type { Metadata, ResolvingMetadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getFirestore } from 'firebase/firestore';
import dynamic from 'next/dynamic';


// This needs to be outside the component to work on the server
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

type Props = {
  params: { id: string }
}

// Note: This function runs on the server, NOT on the client.
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // We need a server-side instance of Firestore
  const db = getFirestore();
  const categoryRef = doc(db, 'categories', params.id);
  const categorySnap = await getDoc(categoryRef);

  if (!categorySnap.exists()) {
    return {
      title: 'Category Not Found',
    }
  }

  const category = categorySnap.data() as Category;
  // We can optionally resolve parent metadata to extend it
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: category.name,
    description: `Découvrez nos produits dans la catégorie ${category.name}`,
    openGraph: {
      title: category.name,
      description: `Découvrez tous les produits de la catégorie ${category.name} sur Tlemcen Smart Supermarket.`,
      images: [
        {
          url: category.image,
          width: 800,
          height: 800,
          alt: category.name,
        },
        ...previousImages,
      ],
    },
  }
}


function CategoryDetailsClient({ categoryId }: { categoryId: string }) {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { categories, areCategoriesLoading } = useCategories();

  const category = useMemoFirebase(() => categories?.find(c => c.id === categoryId), [categories, categoryId]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !categoryId) return null;
    return query(collection(firestore, 'products'), where('categoryId', '==', categoryId));
  }, [firestore, categoryId]);
  
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const isLoading = areCategoriesLoading || areProductsLoading;

  if (!isLoading && !category) {
    notFound();
  }

  if (isLoading) {
      return <CategoryPageSkeleton />;
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">{category?.name}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t('category.subtitle', { name: category?.name || '' })}</p>
      </div>
      <>
        {products && products.length > 0 ? (
          <ProductGrid title="" products={products} />
        ) : (
            <div className="text-center p-8 text-muted-foreground">
            {t('category.noProducts')}
        </div>
        )}
      </>
    </div>
  );
}

function CategoryPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-8">
                <Skeleton className="h-14 w-1/2 mx-auto" />
                <Skeleton className="h-7 w-2/3 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                ))}
            </div>
        </div>
    );
}

export default function CategoryPage({ params }: { params: { id: string } }) {
    return (
        <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryDetailsClient categoryId={params.id} />
        </Suspense>
    );
}
