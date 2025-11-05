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
};

export default function HomePageClient({ categories, bestSellers, exclusiveOffers }: HomePageClientProps) {
  const { t } = useLanguage();
  const { user } = useUser();

  return (
    <div className="container py-8 md:py-12">
      <CategoryShowcase title={t('homepage.categories')} categories={categories} />
      {/* Recommendation logic will be added back if needed */}
      <div className="mt-12 md:mt-16">
        <ProductGrid title={t('homepage.best_sellers')} products={bestSellers} />
      </div>
      <div className="mt-12 md:mt-16">
        <ProductGrid title={t('homepage.exclusive_offers')} products={exclusiveOffers} />
      </div>
    </div>
  );
}
