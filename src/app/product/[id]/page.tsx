'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ProductGrid from '@/components/product/product-grid';
import { ShoppingCart, Plus, Minus, Star, Heart, GitCompareArrows } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, limit, documentId, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import StarRating from '@/components/product/star-rating';
import ReviewsSection from '@/components/shared/reviews-section';
import { useWishlist } from '@/hooks/use-wishlist';
import { cn } from '@/lib/utils';
import { useComparison } from '@/hooks/use-comparison';
import { useLanguage } from '@/contexts/language-provider';
import type { Metadata, ResolvingMetadata } from 'next';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Server-side metadata generation
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const db = getFirestore();
  const productRef = doc(db, 'products', params.id);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    return {
      title: 'Product Not Found',
    }
  }

  const product = productSnap.data() as Product;
  const previousImages = (await parent).openGraph?.images || []

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
  }
}


function ProductDetails({ productId }: { productId: string }) {
  const { t } = useLanguage();
  const { addItem, updateQuantity: updateCartQuantity } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { wishlist, toggleWishlist, isWishlistLoading } = useWishlist();
  const { items: comparisonItems, toggleComparison, MAX_COMPARISON_ITEMS } = useComparison();

  const productRef = useMemoFirebase(() => {
      if (!firestore || !productId) return null;
      return doc(firestore, 'products', productId);
  }, [firestore, productId]);
  const { data: product, isLoading: isLoadingProduct, refetch } = useDoc<Product>(productRef);

  const isWishlisted = !!wishlist?.find(item => item.id === productId);
  const isComparing = !!comparisonItems.find(item => item.id === productId);

  useEffect(() => {
    if (product) {
      try {
        const viewedProductsRaw = localStorage.getItem('viewedProducts');
        const viewedProducts = viewedProductsRaw ? JSON.parse(viewedProductsRaw) : [];
        if (!viewedProducts.includes(product.name)) {
          const updatedViewed = [product.name, ...viewedProducts].slice(0, 10);
          localStorage.setItem('viewedProducts', JSON.stringify(updatedViewed));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.error("Failed to update viewed products in localStorage", e);
      }
    }
  }, [product]);


  const relatedProductsQuery = useMemoFirebase(() => {
    if (!firestore || !product?.categoryId) return null;
    return query(
      collection(firestore, 'products'),
      where('categoryId', '==', product.categoryId),
      where(documentId(), '!=', productId),
      limit(4)
    );
  }, [firestore, product, productId]);
  
  const { data: relatedProducts, isLoading: isLoadingRelated } = useCollection<Product>(relatedProductsQuery);

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoadingProduct) {
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
    )
  }

  if (!product) {
    notFound();
  }

  const discountedPrice = product.price * (1 - (product.discount || 0) / 100);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(t('locale'), { style: 'currency', currency: 'DZD' }).format(amount);
  };

  const handleAddToCart = () => {
    addItem(product);
    updateCartQuantity(product.id, quantity);
    toast({
      title: t('product.addToCart.title'),
      description: t('product.addToCart.description').replace('{{quantity}}', quantity.toString()).replace('{{name}}', product.name),
    });
  };

  const handleWishlistToggle = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: t('product.wishlist.loginRequired.title'),
        description: t('product.wishlist.loginRequired.description'),
      });
      return;
    }
    toggleWishlist(productId);
  };
  
  const handleCompareToggle = () => {
    toggleComparison(product);
  };

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <>
    <div className="container py-8 md:py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-square relative rounded-lg border overflow-hidden mb-4">
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {product.discount > 0 && (
              <Badge variant="destructive" className="absolute top-4 right-4 text-base">
                -{product.discount}%
              </Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 relative rounded-md border overflow-hidden ${selectedImage === index ? 'ring-2 ring-primary' : ''}`}
                >
                  <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={product.averageRating || 0} />
            <span className="text-sm text-muted-foreground">
                ({product.reviewCount || 0} {t('product.reviews')})
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-bold text-primary">{formatCurrency(discountedPrice)}</p>
            {product.discount > 0 && (
              <p className="text-xl text-muted-foreground line-through">{formatCurrency(product.price)}</p>
            )}
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          <div className="mt-auto pt-8 space-y-4">
             <Button 
                variant={isComparing ? "default" : "outline"}
                className="w-full"
                onClick={handleCompareToggle}
                disabled={!isComparing && comparisonItems.length >= MAX_COMPARISON_ITEMS}
             >
                <GitCompareArrows className={cn("mr-2 h-4 w-4", isComparing && "text-primary-foreground")} />
                {isComparing ? t('product.removeFromComparison') : t('product.compare')}
             </Button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  className="h-10 w-16 text-center"
                  value={quantity}
                  onChange={(e) => updateQuantity(parseInt(e.target.value) || 1)}
                  min="1"
                  max={product.stock}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateQuantity(quantity + 1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="lg" className="flex-1 font-bold text-base py-6" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock === 0 ? t('product.outOfStock') : t('product.addToCart.button')}
              </Button>
               <Button size="lg" variant="outline" className="px-4 py-6" onClick={handleWishlistToggle} disabled={isWishlistLoading}>
                  <Heart className={cn("h-6 w-6", isWishlisted && "fill-destructive text-destructive")} />
              </Button>
            </div>
             <p className="text-sm text-muted-foreground mt-2">
              {product.stock > 0 
                  ? t('product.inStock').replace('{{count}}', product.stock.toString())
                  : t('product.outOfStockFull')
              }
             </p>
          </div>
        </div>
      </div>
    </div>
    
    <ReviewsSection targetId={productId} targetCollection="products" onReviewChange={refetch} />

    {relatedProducts && relatedProducts.length > 0 && (
    <div className="container mt-16 md:mt-24 pb-12">
        <ProductGrid title={t('product.relatedProducts')} products={relatedProducts} />
    </div>
    )}
    </>
  );
}


export default function ProductPage({ params }: { params: { id: string } }) {
    return <ProductDetails productId={params.id} />
}
