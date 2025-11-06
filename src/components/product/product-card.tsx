'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
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

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { user } = useUser();
  const { wishlist, toggleWishlist, isWishlistLoading } = useWishlist();

  const isWishlisted = !!wishlist?.find(item => item.id === product.id);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast({
      title: 'Ajouté au panier',
      description: `${product.name} a été ajouté à votre panier.`,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour ajouter des articles à votre liste de souhaits.',
      });
      return;
    }
    toggleWishlist(product.id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(amount);
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
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 left-2 bg-background/50 backdrop-blur-sm rounded-full hover:bg-background/75"
              onClick={handleWishlistToggle}
              disabled={isWishlistLoading}
            >
              <Heart className={cn("h-5 w-5 text-muted-foreground", isWishlisted && "fill-destructive text-destructive")} />
            </Button>
            {product.discount > 0 && (
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
          <Button className="w-full font-bold" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Ajouter au panier
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
