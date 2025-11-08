

'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import ProductGrid from '@/components/product/product-grid';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDoc, getDocs, limit } from 'firebase/firestore';
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
  params: { slug: string }
}

// Note: This function runs on the server, NOT on the client.
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // We need a server-side instance of Firestore
  const db = getFirestore();
  const q = query(collection(db, 'categories'), where('slug', '==', params.slug), limit(1));
  const categorySnap = await getDocs(q);


  if (categorySnap.empty) {
    return {
      title: 'Category Not Found',
    }
  }

  const category = categorySnap.docs[0].data() as Category;
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


function CategoryDetailsClient() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [isLoadingCategory, setIsLoadingCategory] = useState(true);

  useEffect(() => {
    if (!firestore || !slug) return;
    
    const fetchCategory = async () => {
        setIsLoadingCategory(true);
        const q = query(collection(firestore, 'categories'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const doc = snap.docs[0];
            setCategory({ id: doc.id, ...doc.data()} as Category);
        } else {
            setCategory(null);
        }
        setIsLoadingCategory(false);
    }
    fetchCategory();

  }, [firestore, slug]);


  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !category) return null;
    return query(collection(firestore, 'products'), where('categoryId', '==', category.id));
  }, [firestore, category]);
  
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const isLoading = isLoadingCategory || areProductsLoading;

  if (!isLoading && !category) {
    notFound();
  }

  if (isLoading) {
      return <CategoryPageSkeleton />;
  }

  return (
    <div className="container py-6 md:py-8">
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
        <div className="container py-6 md:py-8">
            <div className="text-center mb-8">
                <Skeleton className="h-14 w-1/2 mx-auto" />
                <Skeleton className="h-7 w-2/3 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                ))}
            </div>
        </div>
    );
}

export default function CategoryPage() {
    return (
        <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryDetailsClient />
        </Suspense>
    );
}
