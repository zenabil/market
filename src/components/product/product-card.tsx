'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, GitCompareArrows } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/placeholder-data';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/use-wishlist';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import StarRating from './star-rating';
import { useComparison } from '@/hooks/use-comparison';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { user } = useUser();
  const { wishlist, toggleWishlist, isWishlistLoading } = useWishlist();
  const { items: comparisonItems, toggleComparison, MAX_COMPARISON_ITEMS } = useComparison();

  const isWishlisted = !!wishlist?.find(item => item.id === product.id);
  const isComparing = !!comparisonItems.find(item => item.id === product.id);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product);
    toast({
      title: 'أضيف إلى السلة',
      description: `تمت إضافة ${product.name} إلى سلتك.`,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'تسجيل الدخول مطلوب',
        description: 'يجب عليك تسجيل الدخول لإضافة عناصر إلى قائمة الرغبات الخاصة بك.',
      });
      return;
    }
    toggleWishlist(product.id);
  };
  
  const handleCompareToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleComparison(product);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
  };
  
  const discountedPrice = product.price * (1 - product.discount / 100);

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
      <Link href={`/product/${product.id}`} className="flex flex-col h-full">
        <CardContent className="p-0 flex-grow">
          <div className="aspect-square relative">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className={cn("object-cover", isOutOfStock && "grayscale")}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {isOutOfStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Badge variant="outline" className="text-white bg-black/50 border-white/50 text-sm">
                        نفذ من المخزون
                    </Badge>
                </div>
            )}
            <div className="absolute top-2 left-2 flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="bg-background/50 backdrop-blur-sm rounded-full hover:bg-background/75 h-8 w-8"
                  onClick={handleWishlistToggle}
                  disabled={isWishlistLoading}
                  title={isWishlisted ? 'إزالة من قائمة الرغبات' : 'إضافة إلى قائمة الرغبات'}
                >
                  <Heart className={cn("h-4 w-4 text-muted-foreground", isWishlisted && "fill-destructive text-destructive")} />
                </Button>
                 <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                      "bg-background/50 backdrop-blur-sm rounded-full hover:bg-background/75 h-8 w-8",
                      isComparing && "bg-primary/80 hover:bg-primary"
                    )}
                  onClick={handleCompareToggle}
                  disabled={!isComparing && comparisonItems.length >= MAX_COMPARISON_ITEMS}
                  title={isComparing ? 'إزالة من المقارنة' : 'إضافة إلى المقارنة'}
                >
                  <GitCompareArrows className={cn("h-4 w-4", isComparing ? "text-primary-foreground" : "text-muted-foreground")} />
                </Button>
            </div>
            {product.discount > 0 && !isOutOfStock && (
              <Badge variant="destructive" className="absolute top-2 right-2">
                -{product.discount}%
              </Badge>
            )}
          </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold text-base truncate">{product.name}</h3>
            <div className="flex items-center gap-2">
                <StarRating rating={product.averageRating || 0} size="sm" />
                <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-primary">{formatCurrency(discountedPrice)}</p>
              {product.discount > 0 && (
                 <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-2 md:p-4 mt-auto">
          <Button className="w-full font-bold" onClick={handleAddToCart} disabled={isOutOfStock}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isOutOfStock ? 'نفذ من المخزون' : 'أضف إلى السلة'}
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
