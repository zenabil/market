import HeroCarousel from '@/components/product/hero-carousel';
import CategoryShowcase from '@/components/product/category-showcase';
import ProductGrid from '@/components/product/product-grid';
import { getCategories, getProducts } from '@/lib/placeholder-data';
import HomePageClient from '@/components/layout/home-page-client';

export default function Home() {
  const products = getProducts();
  const categories = getCategories();
  const bestSellers = [...products].sort((a, b) => b.sold - a.sold).slice(0, 8);
  const exclusiveOffers = [...products].filter(p => p.discount > 0).slice(0, 8);

  return (
    <div className="flex flex-col">
      <HeroCarousel />
      <HomePageClient
        categories={categories}
        bestSellers={bestSellers}
        exclusiveOffers={exclusiveOffers}
      />
    </div>
  );
}
