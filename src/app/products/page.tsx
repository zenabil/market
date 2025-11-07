'use client';

import React, { useState, useMemo } from 'react';
import ProductGrid from '@/components/product/product-grid';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProductsPage() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

  const { categories, areCategoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('popularity');

  const isLoading = areProductsLoading || areCategoriesLoading;

  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];

    const productsWithDiscountedPrice = products.map(p => ({
      ...p,
      finalPrice: p.price * (1 - (p.discount || 0) / 100)
    }));
    
    let filtered = selectedCategoryId
      ? productsWithDiscountedPrice.filter(p => p.categoryId === selectedCategoryId)
      : productsWithDiscountedPrice;

    switch (sortOption) {
      case 'price-asc':
        return filtered.sort((a, b) => a.finalPrice - b.finalPrice);
      case 'price-desc':
        return filtered.sort((a, b) => b.finalPrice - a.finalPrice);
      case 'name-asc':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'popularity':
      default:
        return filtered.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    }
  }, [products, selectedCategoryId, sortOption]);

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return 'جميع المنتجات';
    return categories?.find(c => c.id === selectedCategoryId)?.name || 'المنتجات';
  }, [selectedCategoryId, categories]);


  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">{selectedCategoryName}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {selectedCategoryId 
            ? `اكتشف منتجاتنا في فئة ${selectedCategoryName}`
            : 'تصفح تشكيلتنا الكاملة من المنتجات الطازجة وعالية الجودة.'
          }
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Button 
          variant={!selectedCategoryId ? 'default' : 'outline'}
          onClick={() => setSelectedCategoryId(null)}
          size="sm"
        >
          جميع المنتجات
        </Button>
        {categories?.map(category => (
          <Button 
            key={category.id} 
            variant={selectedCategoryId === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategoryId(category.id)}
            size="sm"
          >
            {category.name}
          </Button>
        ))}
      </div>

       <div className="flex justify-end mb-8">
        <Select onValueChange={setSortOption} defaultValue={sortOption}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الترتيب حسب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">الشعبية</SelectItem>
            <SelectItem value="price-asc">السعر: من الأقل إلى الأعلى</SelectItem>
            <SelectItem value="price-desc">السعر: من الأعلى إلى الأقل</SelectItem>
            <SelectItem value="name-asc">الاسم (أ-ي)</SelectItem>
          </SelectContent>
        </Select>
      </div>


      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      ) : (
        <ProductGrid title="" products={sortedAndFilteredProducts || []} />
      )}
    </div>
  );
}
