'use client';

import HeroCarousel from '@/components/product/hero-carousel';
import HomePageClient from '@/components/layout/home-page-client';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { useCategories } from '@/hooks/use-categories';
import { Skeleton } from '@/components/ui/skeleton';

function HomeProducts() {
  const firestore = useFirestore();

  const bestSellersQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), where('sold', '>', 0), orderBy('sold', 'desc'), limit(8)),
    [firestore]
  );
  const { data: bestSellers, isLoading: isLoadingBestSellers } = useCollection<Product>(bestSellersQuery);

  const exclusiveOffersQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), where('discount', '>', 0), orderBy('discount', 'desc'), limit(8)),
    [firestore]
  );
  const { data: exclusiveOffers, isLoading: isLoadingOffers } = useCollection<Product>(exclusiveOffersQuery);
  
  const newArrivalsQuery = useMemoFirebase(
    () => query(collection(firestore, 'products'), orderBy('createdAt', 'desc'), limit(8)),
    [firestore]
  );
  const { data: newArrivals, isLoading: isLoadingNewArrivals } = useCollection<Product>(newArrivalsQuery);

  const { categories, areCategoriesLoading } = useCategories();

  const isLoading = isLoadingBestSellers || isLoadingOffers || areCategoriesLoading || isLoadingNewArrivals;

  if (isLoading) {
    return (
       <div className="container py-8 md:py-12">
          {/* Skeletons for categories and product grids */}
           <div className="mb-12 md:mb-16">
              <h2 className="font-headline text-3xl md:text-4xl text-center mb-8"><Skeleton className="h-10 w-80 mx-auto" /></h2>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
           </div>
          {[...Array(3)].map((_, index) => (
             <div key={index} className="mt-12 md:mt-16">
              <h2 className="font-headline text-3xl md:text-4xl mb-8"><Skeleton className="h-10 w-64" /></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
              </div>
            </div>
          ))}
       </div>
    )
  }

  return (
    <HomePageClient
      categories={categories || []}
      bestSellers={bestSellers || []}
      exclusiveOffers={exclusiveOffers || []}
      newArrivals={newArrivals || []}
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
