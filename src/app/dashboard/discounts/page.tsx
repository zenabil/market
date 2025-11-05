'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/placeholder-data';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function DiscountRow({ product }: { product: Product }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [discount, setDiscount] = React.useState(product.discount || 0);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const productRef = doc(firestore, 'products', product.id);
    
    React.useEffect(() => {
        setDiscount(product.discount || 0);
    }, [product.discount]);

    const handleUpdateDiscount = () => {
        if (discount < 0 || discount > 100) {
            toast({
                variant: 'destructive',
                title: 'Réduction invalide',
                description: 'Le pourcentage de réduction doit être compris entre 0 et 100.',
            });
            return;
        }
        setIsUpdating(true);
        const updateData = { discount };
        updateDoc(productRef, updateData)
            .then(() => {
                toast({
                    title: 'Réduction mise à jour',
                    description: `La réduction pour ${product.name} est maintenant de ${discount}%.`,
                });
            })
            .catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: productRef.path,
                        operation: 'update',
                        requestResourceData: updateData,
                    })
                );
            })
            .finally(() => {
                setIsUpdating(false);
            });
    };

    const handleRemoveDiscount = () => {
        setDiscount(0);
        const updateData = { discount: 0 };
        updateDoc(productRef, updateData)
          .then(() => {
            toast({
                title: 'Réduction supprimée',
                description: `La réduction pour ${product.name} a été supprimée.`,
            });
          })
          .catch(error => {
             errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: productRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                })
             )
          });
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD' }).format(amount);
    };

    const originalPrice = product.price;
    const discountedPrice = product.price * (1 - (discount || 0) / 100);

    return (
        <TableRow>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
                <span className={cn("text-muted-foreground", product.discount > 0 && "line-through")}>{formatCurrency(originalPrice)}</span>
            </TableCell>
            <TableCell className={cn("font-semibold", product.discount > 0 && "text-primary")}>
                {formatCurrency(discountedPrice)}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2 max-w-[150px]">
                    <Input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="h-8"
                        min="0"
                        max="100"
                    />
                    <span className="text-muted-foreground">%</span>
                </div>
            </TableCell>
            <TableCell className="text-right space-x-2">
                <Button size="sm" onClick={handleUpdateDiscount} disabled={discount === (product.discount || 0)}>
                    Mettre à jour
                </Button>
                 {product.discount > 0 && (
                    <Button size="sm" variant="ghost" onClick={handleRemoveDiscount}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 )}
            </TableCell>
        </TableRow>
    );
}

export default function DiscountsPage() {
    const firestore = useFirestore();

    const allProductsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'products'));
    }, [firestore]);

    const { data: products, isLoading } = useCollection<Product>(allProductsQuery);

    return (
        <div className="container py-8 md:py-12">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline text-3xl'>Réductions</CardTitle>
                    <CardDescription>Gérez les réductions pour chaque produit.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>Prix original</TableHead>
                                <TableHead>Prix réduit</TableHead>
                                <TableHead>Réduction (%)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {products && products.map(product => (
                                <DiscountRow key={product.id} product={product} />
                            ))}
                        </TableBody>
                    </Table>
                    {!isLoading && products?.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            Aucun produit trouvé.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
