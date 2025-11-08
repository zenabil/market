
'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ProductGrid from '@/components/product/product-grid';
import { ShoppingCart, Plus, Minus, Star, Heart, GitCompareArrows, Box } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, limit, documentId, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import StarRating from '@/components/product/star-rating';
import { useWishlist } from '@/hooks/use-wishlist';
import { cn } from '@/lib/utils';
import { useComparison } from '@/hooks/use-comparison';
import { useLanguage } from '@/contexts/language-provider';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const ReviewsSection = dynamic(() => import('@/components/shared/reviews-section'), {
    loading: () => <div className="container py-12"><Skeleton className="h-64 w-full" /></div>
});

export default function ProductDetailsClient({ productId }: { productId: string }) {
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

  // Fetch details of bundled items if the product is a bundle
  const bundledItemsQuery = useMemoFirebase(() => {
    if (!firestore || product?.type !== 'bundle' || !product.bundleItems || product.bundleItems.length === 0) return null;
    return query(collection(firestore, 'products'), where(documentId(), 'in', product.bundleItems));
  }, [firestore, product]);
  const { data: bundledItems, isLoading: areBundledItemsLoading } = useCollection<Product>(bundledItemsQuery);


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
    return null; // The parent suspense will handle the skeleton
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

            {product.type === 'standard' && (
                <>
                 <div className="flex flex-col sm:flex-row items-stretch gap-4">
                    <div className="flex items-center gap-2 justify-center">
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
                         <Button size="icon" variant="outline" className="h-10 w-10" onClick={handleWishlistToggle} disabled={isWishlistLoading}>
                            <Heart className={cn("h-5 w-5", isWishlisted && "fill-destructive text-destructive")} />
                        </Button>
                    </div>
                    <Button size="lg" className="flex-1 font-bold text-base py-6" onClick={handleAddToCart} disabled={product.stock === 0}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {product.stock === 0 ? t('product.outOfStock') : t('product.addToCart.button')}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                {product.stock > 0 
                    ? t('product.inStock').replace('{{count}}', product.stock.toString())
                    : t('product.outOfStockFull')
                }
                </p>
                </>
            )}

          </div>
        </div>
      </div>

       {product.type === 'bundle' && (
        <Card className="mt-12">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Box /> Contenu de l'offre groupée</CardTitle>
            </CardHeader>
            <CardContent>
                {areBundledItemsLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : (
                    <div className="divide-y">
                        {bundledItems?.map(item => (
                            <Link key={item.id} href={`/product/${item.id}`} className="flex items-center gap-4 py-3 hover:bg-muted/50 -mx-6 px-6">
                                <Image src={item.images[0]} alt={item.name} width={64} height={64} className="rounded-md border object-cover" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                 <div className="mt-6 flex justify-end">
                    <Button size="lg" className="font-bold text-base py-6" onClick={handleAddToCart} disabled={product.stock === 0}>
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {product.stock === 0 ? t('product.outOfStock') : "Ajouter l'offre au panier"}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}
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
