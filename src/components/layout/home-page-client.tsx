"use client"

import type { Category, Product } from "@/lib/placeholder-data";
import { useLanguage } from "@/hooks/use-language";
import CategoryShowcase from "../product/category-showcase";
import ProductGrid from "../product/product-grid";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import React, { useEffect, useState, useMemo } from "react";
import { getProductRecommendations } from "@/ai/flows/product-recommendations";
import { Skeleton } from "../ui/skeleton";
import { collection, query, where, documentId } from "firebase/firestore";

type HomePageClientProps = {
  categories: Category[];
  bestSellers: Product[];
  exclusiveOffers: Product[];
};

const useRecentProducts = () => {
    const [viewedProducts, setViewedProducts] = useState<string[]>([]);

    useEffect(() => {
        const handleStorageChange = () => {
            const stored = localStorage.getItem('viewedProducts');
            setViewedProducts(stored ? JSON.parse(stored) : []);
        };

        handleStorageChange(); // Initial load
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return viewedProducts;
};

function RecommendedProducts() {
    const { t, locale } = useLanguage();
    const { user } = useUser();
    const viewedProducts = useRecentProducts();
    const [recommendedProductNames, setRecommendedProductNames] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();

    useEffect(() => {
        if (user && viewedProducts.length > 0) {
            setIsLoading(true);
            const browsingHistory = viewedProducts.join(', ');
            getProductRecommendations({ purchaseHistory: '', browsingHistory })
                .then(result => {
                    setRecommendedProductNames(result.recommendedProducts);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [user, viewedProducts]);
    
    // Fetch all products to filter locally, as Firestore doesn't support OR queries on different fields.
    const allProductsQuery = useMemoFirebase(() => {
        if (!firestore || recommendedProductNames.length === 0) return null;
        return query(collection(firestore, 'products'));
    }, [firestore, recommendedProductNames.length > 0]);

    const { data: allProducts, isLoading: areProductsLoading } = useCollection<Product>(allProductsQuery);

    const recommendedProducts = useMemo(() => {
        if (!allProducts || recommendedProductNames.length === 0) return [];
        
        const lowercasedRecNames = recommendedProductNames.map(name => name.toLowerCase());
        
        return allProducts.filter(product => 
            lowercasedRecNames.includes(product.name.en.toLowerCase()) ||
            lowercasedRecNames.includes(product.name.fr.toLowerCase()) ||
            lowercasedRecNames.includes(product.name.ar.toLowerCase())
        ).slice(0, 4); // Limit to 4 recommendations

    }, [allProducts, recommendedProductNames]);


    const finalIsLoading = isLoading || areProductsLoading;

    if (!user || viewedProducts.length === 0 || (!finalIsLoading && recommendedProducts.length === 0)) {
        return null;
    }

    if (finalIsLoading) {
         return (
            <div className="mt-12 md:mt-16">
                <h2 className="font-headline text-3xl md:text-4xl mb-8">{t('homepage.recommended_for_you')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 md:mt-16">
            <ProductGrid title={t('homepage.recommended_for_you')} products={recommendedProducts} />
        </div>
    );
}

export default function HomePageClient({ categories, bestSellers, exclusiveOffers }: HomePageClientProps) {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
      <CategoryShowcase title={t('homepage.categories')} categories={categories} />
      <RecommendedProducts />
      <div className="mt-12 md:mt-16">
        <ProductGrid title={t('homepage.best_sellers')} products={bestSellers} />
      </div>
      <div className="mt-12 md:mt-16">
        <ProductGrid title={t('homepage.exclusive_offers')} products={exclusiveOffers} />
      </div>
    </div>
  );
}
