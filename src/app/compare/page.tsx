'use client';

import React from 'react';
import { useComparison } from '@/hooks/use-comparison';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Trash2, ShoppingCart, Star, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import StarRating from '@/components/product/star-rating';

export default function ComparePage() {
  const { items, removeFromComparison, clearComparison } = useComparison();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: any) => {
    addItem(product);
    toast({
      title: 'Ajouté au panier',
      description: `${product.name} a été ajouté à votre panier.`,
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(amount);
  };

  if (items.length === 0) {
    return (
      <div className="container py-8 md:py-12 text-center">
        <h1 className="font-headline text-4xl md:text-5xl">Comparer les produits</h1>
        <p className="mt-4 text-lg text-muted-foreground">Aucun produit à comparer.</p>
        <Button asChild className="mt-8">
          <Link href="/products">Parcourir les produits</Link>
        </Button>
      </div>
    );
  }
  
  const features = [
    { key: 'price', label: 'Prix' },
    { key: 'averageRating', label: 'Évaluation' },
    { key: 'discount', label: 'Réduction' },
    { key: 'stock', label: 'Stock' },
  ];

  return (
    <div className="container py-8 md:py-12">
        <div className="flex justify-between items-center mb-8">
            <h1 className="font-headline text-4xl md:text-5xl">Comparer les produits</h1>
            <Button variant="outline" onClick={clearComparison}>
                <Trash2 className="mr-2 h-4 w-4" />
                Effacer tout
            </Button>
        </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${items.length + 1} gap-4`}>
        {/* Headers Column */}
        <div className="hidden lg:block">
            <div className="h-[400px]"></div>
            <div className="space-y-4 p-4">
                {features.map(feature => (
                    <div key={feature.key} className="font-bold h-12 flex items-center">{feature.label}</div>
                ))}
            </div>
        </div>

        {/* Product Columns */}
        {items.map(product => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader className="p-4">
                <div className="aspect-square relative mb-4">
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="rounded-md object-cover"
                    />
                     <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full"
                        onClick={() => removeFromComparison(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                </div>
              <CardTitle className="truncate text-lg">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <div className="space-y-4">
                 {features.map(feature => (
                    <div key={feature.key} className="h-12">
                        <span className="font-bold lg:hidden">{feature.label}: </span>
                        <span>
                            {feature.key === 'price' && formatCurrency(product.price * (1 - (product.discount || 0) / 100))}
                            {feature.key === 'averageRating' && <StarRating rating={product.averageRating || 0} />}
                            {feature.key === 'discount' && (product.discount > 0 ? `${product.discount}%` : 'Aucune')}
                            {feature.key === 'stock' && (product.stock > 0 ? `${product.stock} en stock` : 'En rupture')}
                        </span>
                    </div>
                 ))}
              </div>
            </CardContent>
            <CardFooter className="p-4">
              <Button className="w-full" onClick={() => handleAddToCart(product)} disabled={product.stock === 0}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Ajouter au panier
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
