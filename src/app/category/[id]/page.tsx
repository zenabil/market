'use client';

import { notFound } from 'next/navigation';
import ProductGrid from '@/components/product/product-grid';
import { useLanguage } from '@/hooks/use-language';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { getCategoryById } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';

function CategoryDetails({ categoryId }: { categoryId: string }) {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();

  const category = useMemoFirebase(() => getCategoryById(categoryId), [categoryId]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !categoryId) return null;
    return query(collection(firestore, 'products'), where('categoryId', '==', categoryId));
  }, [firestore, categoryId]);
  
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  if (!category) {
    notFound();
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">{category.name[locale]}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t('products.subtitle_category', { categoryName: category.name[locale] })}</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <>
          {products && products.length > 0 ? (
            <ProductGrid title="" products={products} />
          ) : (
             <div className="text-center p-8 text-muted-foreground">
                {t('products.no_products_in_category')}
            </div>
          )}
        </>
      )}
    </div>
  );
}


export default function CategoryPage({ params }: { params: { id: string } }) {
    return <CategoryDetails categoryId={params.id} />
}
