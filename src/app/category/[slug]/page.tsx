

import { Suspense } from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, Category } from '@/lib/placeholder-data';
import { WithContext, BreadcrumbList, ItemList } from 'schema-dts';

const CategoryDetailsClient = dynamic(() => import('./category-client'), {
    loading: () => <CategoryPageSkeleton />,
    ssr: false,
});


// This needs to be outside the component to work on the server
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

type Props = {
  params: { slug: string }
}

// Note: This function runs on the server, NOT on the client.
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const db = getFirestore();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const q = query(collection(db, 'categories'), where('slug', '==', params.slug), limit(1));
  const categorySnap = await getDocs(q);

  if (categorySnap.empty) {
    return {
      title: 'Category Not Found',
    }
  }

  const category = { id: categorySnap.docs[0].id, ...categorySnap.docs[0].data() } as Category;
  
  // Fetch products for ItemList schema
  const productsQuery = query(collection(db, 'products'), where('categoryId', '==', category.id));
  const productsSnap = await getDocs(productsQuery);
  const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

  const previousImages = (await parent).openGraph?.images || []
  
  const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}` },
        { '@type': 'ListItem', position: 2, name: 'Produits', item: `${baseUrl}/products` },
        { '@type': 'ListItem', position: 3, name: category.name, item: `${baseUrl}/category/${category.slug}` }
    ]
  };
  
  const itemListJsonLd: WithContext<ItemList> = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    description: `Découvrez nos produits dans la catégorie ${category.name}`,
    itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
            '@type': 'Product',
            url: `${baseUrl}/product/${product.slug}`,
            name: product.name,
            image: product.images[0],
             ...(product.averageRating && product.reviewCount && {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: product.averageRating.toString(),
                    reviewCount: product.reviewCount.toString(),
                },
            }),
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
    title: category.name,
    description: `Découvrez nos produits dans la catégorie ${category.name}`,
    openGraph: {
      title: category.name,
      description: `Découvrez tous les produits de la catégorie ${category.name} sur Tlemcen Smart Supermarket.`,
      images: [
        {
          url: category.image,
          width: 800,
          height: 800,
          alt: category.name,
        },
        ...previousImages,
      ],
    },
    other: {
        jsonLd: JSON.stringify([breadcrumbJsonLd, itemListJsonLd]),
    }
  }
}

function CategoryPageSkeleton() {
    return (
        <div className="container py-6 md:py-8">
            <div className="text-center mb-8">
                <Skeleton className="h-14 w-1/2 mx-auto" />
                <Skeleton className="h-7 w-2/3 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full" />
                ))}
            </div>
        </div>
    );
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<CategoryPageSkeleton />}>
            <CategoryDetailsClient slug={params.slug} />
        </Suspense>
    );
}
