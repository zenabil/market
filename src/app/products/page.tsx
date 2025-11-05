'use client';

import ProductGrid from '@/components/product/product-grid';
import { getProducts } from '@/lib/placeholder-data';
import { useLanguage } from '@/hooks/use-language';

export default function ProductsPage() {
  const { t } = useLanguage();
  const products = getProducts();

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">{t('products.title')}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{t('products.subtitle')}</p>
      </div>
      <ProductGrid title="" products={products} />
    </div>
  );
}
