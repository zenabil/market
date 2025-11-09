

import { Suspense } from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product, Category, Review } from '@/lib/placeholder-data';
import { WithContext, Product as ProductSchema, BreadcrumbList, Review as ReviewSchema } from 'schema-dts';

const ProductDetailsClient = dynamic(() => import('./product-details-client'), { ssr: false, loading: () => <ProductPageSkeleton /> });

// Server-side metadata generation
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const db = getFirestore();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('slug', '==', params.slug), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return {
      title: 'Product Not Found',
    }
  }

  const productDoc = querySnapshot.docs[0];
  const product = { id: productDoc.id, ...productDoc.data() } as Product;

  const previousImages = (await parent).openGraph?.images || []
  
  const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
  
  // Fetch category for breadcrumbs
  let category: Category | null = null;
  if (product.categoryId) {
      const categoryRef = doc(db, 'categories', product.categoryId);
      const categorySnap = await getDoc(categoryRef);
      if (categorySnap.exists()) {
          category = { id: categorySnap.id, ...categorySnap.data() } as Category;
      }
  }
  
  // Fetch latest 5 reviews for schema
  const reviewsQuery = query(collection(db, `products/${product.id}/reviews`), orderBy('createdAt', 'desc'), limit(5));
  const reviewsSnapshot = await getDocs(reviewsQuery);
  const reviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);

  const productJsonLd: WithContext<ProductSchema> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: discountedPrice.toFixed(2),
      priceCurrency: 'DZD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${baseUrl}/product/${product.slug}`
    },
    ...(product.reviewCount && product.reviewCount > 0 && product.averageRating ? {
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating.toFixed(1),
            reviewCount: product.reviewCount
        },
        review: reviews.map(review => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: review.userName },
            datePublished: review.createdAt,
            reviewBody: review.comment,
            reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating.toString()
            }
        } as ReviewSchema))
    } : {})
  };
  
  const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${baseUrl}` },
        { '@type': 'ListItem', position: 2, name: 'Produits', item: `${baseUrl}/products` },
        ...(category ? [{ '@type': 'ListItem', position: 3, name: category.name, item: `${baseUrl}/category/${category.slug}` } as const] : []),
        { '@type': 'ListItem', position: category ? 4 : 3, name: product.name, item: `${baseUrl}/product/${product.slug}` }
    ].filter(Boolean)
  };


  return {
    title: product.name,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      images: [
        {
          url: product.images[0],
          width: 800,
          height: 800,
          alt: product.name,
        },
        ...previousImages,
      ],
    },
     twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.substring(0, 160),
      images: [product.images[0]],
    },
    alternates: {
        canonical: `/product/${product.slug}`,
    },
    other: {
      jsonLd: JSON.stringify([productJsonLd, breadcrumbJsonLd])
    }
  }
}

function ProductPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div>
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <div className="flex gap-2 mt-4">
                        <Skeleton className="w-20 h-20 rounded-md" />
                        <Skeleton className="w-20 h-20 rounded-md" />
                        <Skeleton className="w-20 h-20 rounded-md" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-3/4" />
                    <Skeleton className="h-10 w-1/4" />
                    <Skeleton className="h-px w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-full" />
                    <div className="flex items-center gap-4 pt-4">
                        <Skeleton className="h-12 w-32" />
                        <Skeleton className="h-12 flex-1" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductPage({ params }: { params: { slug: string } }) {
    return (
        <Suspense fallback={<ProductPageSkeleton />}>
            <ProductDetailsClient productSlug={params.slug} />
        </Suspense>
    );
}
