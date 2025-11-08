import HeroCarousel from '@/components/product/hero-carousel';
import { getFirestore, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import type { Product, Recipe } from '@/lib/placeholder-data';
import HomePageClient from '@/components/layout/home-page-client';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase for server-side fetching if it hasn't been already.
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

async function getProductsByQuery(q: any) {
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

async function getRecipesByQuery(q: any) {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipe));
}

async function getHomePageData() {
  const db = getFirestore();
  const productsRef = collection(db, 'products');
  const recipesRef = collection(db, 'recipes');

  const bestSellersQuery = query(productsRef, orderBy('sold', 'desc'), limit(8));
  const newArrivalsQuery = query(productsRef, orderBy('createdAt', 'desc'), limit(4));
  const exclusiveOffersQuery = query(productsRef, where('discount', '>', 0), limit(4));
  const recipesQuery = query(recipesRef, limit(4));

  const [bestSellers, newArrivals, exclusiveOffers, recipes] = await Promise.all([
    getProductsByQuery(bestSellersQuery),
    getProductsByQuery(newArrivalsQuery),
    getProductsByQuery(exclusiveOffersQuery),
    getRecipesByQuery(recipesQuery)
  ]);

  return { bestSellers, newArrivals, exclusiveOffers, recipes };
}

export default async function Home() {
  const { bestSellers, newArrivals, exclusiveOffers, recipes } = await getHomePageData();

  return (
    <div className="flex flex-col">
      <HeroCarousel />
      <HomePageClient 
        bestSellers={bestSellers}
        newArrivals={newArrivals}
        exclusiveOffers={exclusiveOffers}
        recipes={recipes}
      />
    </div>
  );
}
