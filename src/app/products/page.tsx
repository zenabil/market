

import { Suspense } from 'react';
import ProductsPageClient from './products-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata, ResolvingMetadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import type { Product } from '@/lib/placeholder-data';
import { WithContext, ItemList } from 'schema-dts';


if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export async function generateMetadata(
  {},
  parent: ResolvingMetadata
): Promise<Metadata> {
  const db = getFirestore();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const productsQuery = query(collection(db, 'products'));
  const productsSnap = await getDocs(productsQuery);
  const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  
  const itemListJsonLd: WithContext<ItemList> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: "Tous les produits",
    description: "Parcourez notre gamme complète de produits frais et de haute qualité.",
    itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
            '@type': 'Product',
            url: `${baseUrl}/product/${product.slug}`,
            name: product.name,
            image: product.images[0],
            offers: {
                '@type': 'Offer',
                price: (product.price * (1 - (product.discount || 0) / 100)).toFixed(2),
                priceCurrency: 'DZD',
                availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            }
        }
    }))
  };

  return {
    title: 'Tous les produits',
    description: 'Parcourez notre gamme complète de produits frais et de haute qualité chez Tlemcen Smart Supermarket.',
    other: {
      jsonLd: JSON.stringify(itemListJsonLd)
    }
  };
}


export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsPageClient />
    </Suspense>
  );
}

function ProductsPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-8">
                <Skeleton className="h-12 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-2/3 mx-auto mt-2" />
            </div>
             <div className="flex flex-wrap justify-center gap-2 mb-8">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-24" />)}
            </div>
             <div className="flex justify-end mb-8">
                 <Skeleton className="h-10 w-[180px]" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                ))}
            </div>
        </div>
    )
}
