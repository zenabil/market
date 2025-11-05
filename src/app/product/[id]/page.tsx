'use client';

import { useState } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/hooks/use-language';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ProductGrid from '@/components/product/product-grid';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import type { Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';


function ProductDetails({ productId }: { productId: string }) {
  const { t, locale } = useLanguage();
  const { addItem, updateQuantity: updateCartQuantity } = useCart();
  const { toast } = useToast();
  const firestore = useFirestore();

  const productRef = useMemoFirebase(() => doc(firestore, 'products', productId), [firestore, productId]);
  const { data: product, isLoading: isLoadingProduct } = useDoc<Product>(productRef);

  const relatedProductsQuery = useMemoFirebase(() => {
    if (!product) return null;
    return query(
      collection(firestore, 'products'),
      where('categoryId', '==', product.categoryId),
      where('id', '!=', product.id),
      limit(4)
    );
  }, [firestore, product]);
  
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
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' }).format(amount);
  };

  const handleAddToCart = () => {
    addItem(product);
    updateCartQuantity(product.id, quantity);
    toast({
      title: t('cart.added_to_cart_title'),
      description: `${product.name[locale]} (${quantity}) ${t('cart.added_to_cart_desc')}`,
    });
  };

  const updateQuantity = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-square relative rounded-lg border overflow-hidden mb-4">
            <Image
              src={product.images[selectedImage]}
              alt={product.name[locale]}
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
                  <Image src={img} alt={`${product.name[locale]} thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl">{product.name[locale]}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-3xl font-bold text-primary">{formatCurrency(discountedPrice)}</p>
            {product.discount > 0 && (
              <p className="text-xl text-muted-foreground line-through">{formatCurrency(product.price)}</p>
            )}
          </div>
          <Separator className="my-6" />
          <p className="text-muted-foreground leading-relaxed">{product.description[locale]}</p>
          <div className="mt-8 flex items-center gap-4">
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
              {product.stock === 0 ? t('product.out_of_stock') : t('cart.add_to_cart')}
            </Button>
          </div>
           <p className="text-sm text-muted-foreground mt-2">
            {product.stock > 0 
                ? t('product.stock_available', { count: product.stock })
                : t('product.out_of_stock_long')
            }
           </p>
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16 md:mt-24">
          <ProductGrid title={t('product.related_products')} products={relatedProducts} />
        </div>
      )}
    </div>
  );
}


export default function ProductPage({ params }: { params: { id: string } }) {
    return <ProductDetails productId={params.id} />
}
