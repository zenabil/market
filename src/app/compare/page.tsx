
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
import StarRating from '@/components/product/star-rating';
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table';
import type { Product } from '@/lib/placeholder-data';
import { useLanguage } from '@/contexts/language-provider';


export default function ComparePage() {
  const { t } = useLanguage();
  const { items, removeFromComparison, clearComparison } = useComparison();
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast({
      title: t('compare.addToCart.title'),
      description: t('compare.addToCart.description').replace('{{name}}', product.name),
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(t('locale'), { style: 'currency', currency: 'DZD' }).format(amount);
  };

  if (items.length === 0) {
    return (
      <div className="container py-8 md:py-12 text-center">
        <h1 className="font-headline text-4xl md:text-5xl">{t('compare.title')}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('compare.noProducts')}</p>
        <Button asChild className="mt-8">
          <Link href="/products">{t('compare.browseProducts')}</Link>
        </Button>
      </div>
    );
  }
  
  const features = [
    { key: 'price', label: t('compare.features.price') },
    { key: 'averageRating', label: t('compare.features.rating') },
    { key: 'reviewCount', label: t('compare.features.reviewCount') },
    { key: 'discount', label: t('compare.features.discount') },
    { key: 'stock', label: t('compare.features.stock') },
  ];

  const renderFeature = (product: Product, featureKey: string) => {
    switch(featureKey) {
        case 'price':
            return formatCurrency(product.price * (1 - (product.discount || 0) / 100));
        case 'averageRating':
            return <StarRating rating={product.averageRating || 0} />;
        case 'reviewCount':
            return t('compare.reviews').replace('{{count}}', (product.reviewCount || 0).toString());
        case 'discount':
            return product.discount > 0 ? `${product.discount}%` : t('compare.noDiscount');
        case 'stock':
            return product.stock > 0 ? t('compare.inStock').replace('{{count}}', product.stock.toString()) : t('compare.outOfStock');
        default:
            return null;
    }
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-headline text-4xl md:text-5xl">{t('compare.compareTitle')}</h1>
        {items.length > 0 && (
          <Button variant="outline" onClick={clearComparison} size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            {t('compare.clearAll')}
          </Button>
        )}
      </div>

      {/* Mobile View: Stacked cards */}
      <div className="grid grid-cols-1 gap-6 sm:hidden">
        {items.map(product => (
          <Card key={product.id} className="relative">
             <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 rounded-full z-10"
                onClick={() => removeFromComparison(product.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            <CardHeader>
                <div className="aspect-square relative w-full">
                    <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="rounded-md object-cover"
                    />
                </div>
                <CardTitle className="pt-4">{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                         {features.map(feature => (
                            <TableRow key={feature.key}>
                                <TableCell className="font-semibold">{feature.label}</TableCell>
                                <TableCell>{renderFeature(product, feature.key)}</TableCell>
                            </TableRow>
                         ))}
                    </TableBody>
                </Table>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => handleAddToCart(product)} disabled={product.stock === 0}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t('compare.addToCart.button')}
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Desktop View: Comparison Table */}
      <div className="hidden sm:block">
        <Table className="border rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead className="font-headline text-lg w-[200px]">{t('compare.features.title')}</TableHead>
              {items.map(product => (
                <TableHead key={product.id}>
                  <div className="flex flex-col items-center text-center gap-2">
                     <div className="relative h-24 w-24">
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover rounded-md" />
                         <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => removeFromComparison(product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                     </div>
                     <h3 className="font-bold text-sm text-foreground">{product.name}</h3>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map(feature => (
              <TableRow key={feature.key}>
                <TableCell className="font-bold text-base">{feature.label}</TableCell>
                {items.map(product => (
                  <TableCell key={product.id} className="text-center align-middle h-20">
                    <div className="flex items-center justify-center">
                      {renderFeature(product, feature.key)}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
                <TableCell></TableCell>
                {items.map(product => (
                  <TableCell key={product.id} className="text-center p-4">
                     <Button className="w-full" onClick={() => handleAddToCart(product)} disabled={product.stock === 0}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {t('compare.add')}
                    </Button>
                  </TableCell>
                ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
