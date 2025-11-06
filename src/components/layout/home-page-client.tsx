"use client"

import type { Category, Product } from "@/lib/placeholder-data";
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
                    // Ensure we have a valid array of product names, max 30 for 'in' query.
                    if (result?.recommendedProducts && Array.isArray(result.recommendedProducts)) {
                       setRecommendedProductNames(result.recommendedProducts.slice(0, 30));
                    } else {
                       setRecommendedProductNames([]);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [user, viewedProducts]);
    
    // Fetch only the products that match the recommended names.
    const recommendedProductsQuery = useMemoFirebase(() => {
        if (!firestore || recommendedProductNames.length === 0) return null;
        // The 'in' query is limited to 30 items, which we've handled in the useEffect.
        return query(collection(firestore, 'products'), where('name', 'in', recommendedProductNames));
    }, [firestore, recommendedProductNames]);

    const { data: recommendedProducts, isLoading: areProductsLoading } = useCollection<Product>(recommendedProductsQuery);

    const finalIsLoading = isLoading || areProductsLoading;

    if (!user || viewedProducts.length === 0 || (!finalIsLoading && (!recommendedProducts || recommendedProducts.length === 0))) {
        return null;
    }

    if (finalIsLoading) {
         return (
            <div className="mt-12 md:mt-16">
                <h2 className="font-headline text-3xl md:text-4xl mb-8">Recommandé pour vous</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 md:mt-16">
            <ProductGrid title="Recommandé pour vous" products={recommendedProducts || []} />
        </div>
    );
}

export default function HomePageClient({ categories, bestSellers, exclusiveOffers }: HomePageClientProps) {

  return (
    <div className="container py-8 md:py-12">
      <CategoryShowcase title="Parcourir les catégories" categories={categories} />
      <RecommendedProducts />
      <div className="mt-12 md:mt-16">
        <ProductGrid title="Meilleures ventes" products={bestSellers} />
      </div>
      <div className="mt-12 md:mt-16">
        <ProductGrid title="Offres exclusives" products={exclusiveOffers} />
      </div>
    </div>
  );
}
