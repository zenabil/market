'use client';

import ProductGrid from '@/components/product/product-grid';
import { useLanguage } from '@/hooks/use-language';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">{t('products.title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t('products.subtitle')}</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <ProductGrid title="" products={products || []} />
      )}
    </div>
  );
}
