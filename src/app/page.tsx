'use client';

import HeroCarousel from '@/components/product/hero-carousel';
import HomePageClient from '@/components/layout/home-page-client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Product, Category } from '@/lib/placeholder-data';
import { getCategories } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import ProductGrid from '@/components/product/product-grid';
import CategoryShowcase from '@/components/product/category-showcase';
import { useLanguage } from '@/hooks/use-language';

function HomeProducts() {
  const firestore = useFirestore();
  const { t } = useLanguage();

  const allProductsQuery = useMemoFirebase(
    () => query(collection(firestore, 'products')),
    [firestore]
  );
  const { data: allProducts, isLoading: isLoadingAllProducts } = useCollection<Product>(allProductsQuery);

  const bestSellersQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), orderBy('sold', 'desc'), limit(8)),
    [firestore]
  );
  const { data: bestSellers, isLoading: isLoadingBestSellers } = useCollection<Product>(bestSellersQuery);

  const exclusiveOffersQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), orderBy('discount', 'desc'), limit(8)),
    [firestore]
  );
  const { data: exclusiveOffers, isLoading: isLoadingOffers } = useCollection<Product>(exclusiveOffersQuery);
  
  const categories = getCategories();

  const isLoading = isLoadingAllProducts || isLoadingBestSellers || isLoadingOffers;

  if (isLoading) {
    return (
       <div className="container py-8 md:py-12">
          <div className="mt-12 md:mt-16">
            <h2 className="font-headline text-3xl md:text-4xl mb-8"><Skeleton className="h-10 w-64" /></h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
          </div>
           <div className="mt-12 md:mt-16">
            <h2 className="font-headline text-3xl md:text-4xl mb-8"><Skeleton className="h-10 w-64" /></h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
          </div>
       </div>
    )
  }

  return (
    <HomePageClient
      categories={categories}
      bestSellers={bestSellers || []}
      exclusiveOffers={exclusiveOffers || []}
      allProducts={allProducts || []}
    />
  );
}


export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroCarousel />
      <HomeProducts />
    </div>
  );
}
