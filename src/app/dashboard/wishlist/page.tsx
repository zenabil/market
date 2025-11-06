'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { Product } from '@/lib/placeholder-data';
import { collection, query, where, documentId } from 'firebase/firestore';
import ProductGrid from '@/components/product/product-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { HeartCrack } from 'lucide-react';

export default function WishlistPage() {
    const firestore = useFirestore();
    const { wishlist, isWishlistLoading } = useWishlist();

    const productIds = useMemo(() => {
        if (!wishlist || wishlist.length === 0) return null;
        return wishlist.map(item => item.id);
    }, [wishlist]);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !productIds) return null;
        // Firestore 'in' query is limited to 30 items. For larger wishlists, pagination would be needed.
        return query(collection(firestore, 'products'), where(documentId(), 'in', productIds));
    }, [firestore, productIds]);

    const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);
    
    const isLoading = isWishlistLoading || (wishlist && wishlist.length > 0 && areProductsLoading);

    return (
        <div className="container py-8 md:py-12">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline text-3xl'>Ma liste de souhaits</CardTitle>
                    <CardDescription>Vos produits préférés, tous au même endroit.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-80 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            {products && products.length > 0 ? (
                                <ProductGrid title="" products={products} />
                            ) : (
                                <div className="text-center p-16 text-muted-foreground flex flex-col items-center gap-4">
                                    <HeartCrack className="h-16 w-16" />
                                    <p className="text-lg font-medium">Votre liste de souhaits est vide</p>
                                    <p>Ajoutez des produits que vous aimez pour les retrouver facilement plus tard.</p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
