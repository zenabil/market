"use client"

import type { Category, Product } from "@/lib/placeholder-data";
import { useLanguage } from "@/hooks/use-language";
import CategoryShowcase from "../product/category-showcase";
import ProductGrid from "../product/product-grid";
import { useUser } from "@/firebase";
import React, { useEffect, useState } from "react";
import { getProductRecommendations } from "@/ai/flows/product-recommendations";
import { Skeleton } from "../ui/skeleton";

type HomePageClientProps = {
  categories: Category[];
  bestSellers: Product[];
  exclusiveOffers: Product[];
  allProducts: Product[]; // Pass all products for recommendation lookup
};

function RecommendedForYou({ allProducts }: { allProducts: Product[] }) {
  const { t } = useLanguage();
  const { user } = useUser();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      if (user && allProducts.length > 0) {
        // In a real app, you'd get this from user activity logs
        const browsingHistory = allProducts.slice(0, 5).map(p => p.name.en).join(', '); 
        const purchaseHistory = allProducts.slice(3, 7).map(p => p.name.en).join(', ');

        try {
          const result = await getProductRecommendations({
            browsingHistory,
            purchaseHistory,
          });
          
          // Map recommended names back to full product objects
          const recs = result.recommendedProducts
            .map(recName => allProducts.find(p => p.name.en.toLowerCase() === recName.toLowerCase()))
            .filter((p): p is Product => Boolean(p));

          setRecommendedProducts(recs);
        } catch (error) {
          console.error("Failed to get recommendations:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    fetchRecommendations();
  }, [user, allProducts]);

  if (!user || (!isLoading && recommendedProducts.length === 0)) {
    return null;
  }
  
  if (isLoading) {
      return (
          <div className="mt-12 md:mt-16">
            <h2 className="font-headline text-3xl md:text-4xl mb-8"><Skeleton className="h-10 w-64" /></h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
          </div>
      )
  }

  return (
    <div className="mt-12 md:mt-16">
      <ProductGrid title={t('homepage.recommended_for_you')} products={recommendedProducts} />
    </div>
  );
}


export default function HomePageClient({ categories, bestSellers, exclusiveOffers, allProducts }: HomePageClientProps) {
  const { t } = useLanguage();
  const { user } = useUser();

  return (
    <div className="container py-8 md:py-12">
      <CategoryShowcase title={t('homepage.categories')} categories={categories} />
      {user && <RecommendedForYou allProducts={allProducts} />}
      <div className="mt-12 md:mt-16">
        <ProductGrid title={t('homepage.best_sellers')} products={bestSellers} />
      </div>
      <div className="mt-12 md:mt-16">
        <ProductGrid title={t('homepage.exclusive_offers')} products={exclusiveOffers} />
      </div>
    </div>
  );
}
