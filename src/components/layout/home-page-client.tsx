"use client"

import type { Category, Product } from "@/lib/placeholder-data";
import dynamic from 'next/dynamic';
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import React, { useEffect, useState, useMemo } from "react";
import { getProductRecommendations } from "@/ai/flows/product-recommendations";
import { Skeleton } from "../ui/skeleton";
import { collection, query, where, documentId } from "firebase/firestore";
import { useLanguage } from "@/contexts/language-provider";
import { useCategories } from "@/hooks/use-categories";
import { Award, Leaf, Truck, type LucideProps, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type StoreFeature = {
    id: string;
    title_fr: string;
    description_fr: string;
    title_ar: string;
    description_ar: string;
    icon: string;
};

// Map icon names to actual components
const iconMap: { [key: string]: React.FC<LucideProps> } = {
    Leaf: Leaf,
    Truck: Truck,
    Award: Award,
    Sparkles: Sparkles,
};


const CategoryShowcase = dynamic(() => import('../product/category-showcase'), {
  loading: () => <CategoryShowcaseSkeleton />,
});
const ProductGrid = dynamic(() => import('../product/product-grid'), {
    loading: () => <ProductGridSkeleton />,
});

function CategoryShowcaseSkeleton() {
    return (
        <div className="mb-12 md:mb-16">
            <Skeleton className="h-10 w-80 mx-auto mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
        </div>
    );
}

function ProductGridSkeleton() {
    return (
        <div className="mt-12 md:mt-16">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
        </div>
    );
}


type HomePageClientProps = {
  bestSellers: Product[];
  exclusiveOffers: Product[];
  newArrivals: Product[];
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
    const { t } = useLanguage();
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
            <ProductGridSkeleton />
        );
    }

    return (
        <div className="mt-12 md:mt-16">
            <ProductGrid title={t('home.recommendedForYou')} products={recommendedProducts || []} />
        </div>
    );
}

function WhyChooseUs() {
    const { t, locale } = useLanguage();
    const firestore = useFirestore();

    const featuresQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'storeFeatures'));
    }, [firestore]);

    const { data: features, isLoading } = useCollection<StoreFeature>(featuresQuery);

    if (isLoading || !features || features.length === 0) {
        return null; // Or a skeleton loader
    }
    
    return (
        <section className="mt-16 md:mt-24 text-center">
            <h2 className="font-headline text-3xl md:text-4xl">{t('home.whyChooseUs')}</h2>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature) => {
                    const Icon = iconMap[feature.icon] || Leaf;
                    return (
                        <Card key={feature.id} className="text-center">
                            <CardContent className="p-6">
                                <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                    <Icon className="h-6 w-6"/>
                                </div>
                                <h3 className="font-bold text-lg">{locale === 'ar' ? feature.title_ar : feature.title_fr}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{locale === 'ar' ? feature.description_ar : feature.description_fr}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </section>
    );
}


export default function HomePageClient({ bestSellers, exclusiveOffers, newArrivals }: HomePageClientProps) {
  const { t } = useLanguage();
  const { categories, areCategoriesLoading } = useCategories();

  return (
    <div className="container py-8 md:py-12">
      {areCategoriesLoading ? (
        <CategoryShowcaseSkeleton />
      ) : (
        <CategoryShowcase title={t('home.browseCategories')} categories={categories || []} />
      )}
      <WhyChooseUs />
      <ProductGrid title={t('home.bestSellers')} products={bestSellers} />
      <ProductGrid title={t('home.newArrivals')} products={newArrivals} />
      <ProductGrid title={t('home.exclusiveOffers')} products={exclusiveOffers} />
      <RecommendedProducts />
    </div>
  );
}
