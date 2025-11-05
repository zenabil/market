'use client';

import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/placeholder-data';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

function DiscountRow({ product }: { product: Product }) {
    const { locale, t } = useLanguage();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [discount, setDiscount] = React.useState(product.discount || 0);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const productRef = doc(firestore, 'products', product.id);

    const handleUpdateDiscount = () => {
        if (discount < 0 || discount > 100) {
            toast({
                variant: 'destructive',
                title: t('dashboard.discounts.invalid_discount_title'),
                description: t('dashboard.discounts.invalid_discount_desc'),
            });
            return;
        }
        setIsUpdating(true);
        updateDocumentNonBlocking(productRef, { discount });
        toast({
            title: t('dashboard.discounts.discount_updated_title'),
            description: t('dashboard.discounts.discount_updated_desc', { productName: product.name[locale], discount: discount }),
        });
        setIsUpdating(false);
    };

    const handleRemoveDiscount = () => {
        setDiscount(0);
        updateDocumentNonBlocking(productRef, { discount: 0 });
        toast({
            title: t('dashboard.discounts.discount_removed_title'),
            description: t('dashboard.discounts.discount_removed_desc', { productName: product.name[locale] }),
        });
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' }).format(amount);
    };

    const originalPrice = product.price;
    const discountedPrice = product.price * (1 - (discount || 0) / 100);

    return (
        <TableRow>
            <TableCell className="font-medium">{product.name[locale]}</TableCell>
            <TableCell>
                <span className={cn("text-muted-foreground", discount > 0 && "line-through")}>{formatCurrency(originalPrice)}</span>
            </TableCell>
            <TableCell className={cn("font-semibold", discount > 0 && "text-primary")}>
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
                <Button size="sm" onClick={handleUpdateDiscount} disabled={isUpdating || discount === product.discount}>
                    {t('dashboard.discounts.update')}
                </Button>
                 {discount > 0 && (
                    <Button size="sm" variant="ghost" onClick={handleRemoveDiscount}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 )}
            </TableCell>
        </TableRow>
    );
}

export default function DiscountsPage() {
    const { t } = useLanguage();
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
                    <CardTitle className='font-headline text-3xl'>{t('dashboard.nav.discounts')}</CardTitle>
                    <CardDescription>{t('dashboard.discounts.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('dashboard.product')}</TableHead>
                                <TableHead>{t('dashboard.discounts.original_price')}</TableHead>
                                <TableHead>{t('dashboard.discounts.discounted_price')}</TableHead>
                                <TableHead>{t('dashboard.discount_percentage')}</TableHead>
                                <TableHead className="text-right">{t('dashboard.actions')}</TableHead>
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
                            {t('dashboard.no_products_found')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
