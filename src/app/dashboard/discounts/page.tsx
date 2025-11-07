
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
import { Loader2, Trash2, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/use-categories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applyDiscountToCategory } from '@/lib/services/product';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-provider';

function DiscountRow({ product, onUpdate }: { product: Product, onUpdate: () => void }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [discount, setDiscount] = React.useState(product.discount || 0);
    const [isUpdating, setIsUpdating] = React.useState(false);

    const productRef = doc(firestore, 'products', product.id);
    
    React.useEffect(() => {
        setDiscount(product.discount || 0);
    }, [product.discount]);

    const handleUpdateDiscount = (newDiscount: number) => {
        if (newDiscount < 0 || newDiscount > 100) {
            toast({
                variant: 'destructive',
                title: t('dashboard.discounts.validation.invalidTitle'),
                description: t('dashboard.discounts.validation.invalidDescription'),
            });
            return;
        }
        setIsUpdating(true);
        const updateData = { discount: newDiscount };
        updateDoc(productRef, updateData)
            .then(() => {
                toast({
                    title: t('dashboard.discounts.toast.updatedTitle'),
                    description: t('dashboard.discounts.toast.updatedDescription').replace('{{name}}', product.name).replace('{{discount}}', newDiscount.toString()),
                });
                onUpdate();
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(t('locale'), { style: 'currency', currency: 'DZD' }).format(amount);
    };

    const originalPrice = product.price;
    const discountedPrice = product.price * (1 - (discount || 0) / 100);
    const hasDiscount = (product.discount || 0) > 0;

    return (
        <TableRow>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
                <span className={cn("text-muted-foreground", hasDiscount && "line-through")}>{formatCurrency(originalPrice)}</span>
            </TableCell>
            <TableCell className={cn("font-semibold", hasDiscount && "text-primary")}>
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
                <Button size="sm" onClick={() => handleUpdateDiscount(discount)} disabled={discount === (product.discount || 0) || isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('dashboard.common.update')}
                </Button>
                 {hasDiscount && (
                    <Button size="sm" variant="ghost" onClick={() => handleUpdateDiscount(0)} disabled={isUpdating}>
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="sr-only">{t('dashboard.common.delete')}</span>
                    </Button>
                 )}
            </TableCell>
        </TableRow>
    );
}

function CategoryDiscountManager({ onUpdate }: { onUpdate: () => void }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { toast } = useToast();
    const { categories, areCategoriesLoading } = useCategories();
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
    const [discount, setDiscount] = React.useState(0);
    const [isApplying, setIsApplying] = React.useState(false);

    const handleApplyDiscount = async () => {
        if (!firestore || !selectedCategoryId) {
            toast({ variant: 'destructive', title: t('dashboard.discounts.validation.selectCategory') });
            return;
        }
         if (discount < 0 || discount > 100) {
            toast({ variant: 'destructive', title: t('dashboard.discounts.validation.invalidTitle'), description: t('dashboard.discounts.validation.invalidDescription') });
            return;
        }
        setIsApplying(true);
        try {
            const count = await applyDiscountToCategory(firestore, selectedCategoryId, discount);
            toast({ title: t('dashboard.discounts.toast.appliedTitle'), description: t('dashboard.discounts.toast.appliedDescription').replace('{{count}}', count.toString()) });
            onUpdate();
        } catch (error: any) {
             toast({ variant: 'destructive', title: t('dashboard.common.error'), description: error.message });
        } finally {
            setIsApplying(false);
        }
    };
    
    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Percent /> {t('dashboard.discounts.applyToCategory')}</CardTitle>
                <CardDescription>{t('dashboard.discounts.applyToCategoryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Select onValueChange={setSelectedCategoryId} disabled={areCategoriesLoading}>
                        <SelectTrigger className="sm:w-[250px]">
                            <SelectValue placeholder={areCategoriesLoading ? t('dashboard.common.loading') : t('dashboard.discounts.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                            {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="%"
                            className="w-24"
                            min="0" max="100"
                            value={discount}
                            onChange={e => setDiscount(Number(e.target.value))}
                        />
                         <span className="text-muted-foreground">%</span>
                    </div>
                    <Button onClick={handleApplyDiscount} disabled={!selectedCategoryId || isApplying}>
                        {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('dashboard.common.apply')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function DiscountsPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { isAdmin, isRoleLoading } = useUserRole();
    const router = useRouter();

    const allProductsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'products'));
    }, [firestore]);

    const { data: products, isLoading: areProductsLoading, refetch } = useCollection<Product>(allProductsQuery);
    
    React.useEffect(() => {
        if (!isRoleLoading && !isAdmin) {
            router.replace('/dashboard');
        }
    }, [isAdmin, isRoleLoading, router]);

    const isLoading = areProductsLoading || isRoleLoading;

    if (isLoading || !isAdmin) {
        return (
            <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container py-8 md:py-12">
            <div className="mb-8">
                <h1 className='font-headline text-3xl'>{t('dashboard.layout.discounts')}</h1>
                <p className="text-muted-foreground">{t('dashboard.discounts.pageDescription')}</p>
            </div>
            
            <CategoryDiscountManager onUpdate={refetch} />
            
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.discounts.byProductTitle')}</CardTitle>
                    <CardDescription>{t('dashboard.discounts.byProductDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('dashboard.discounts.product')}</TableHead>
                                <TableHead>{t('dashboard.discounts.originalPrice')}</TableHead>
                                <TableHead>{t('dashboard.discounts.discountedPrice')}</TableHead>
                                <TableHead>{t('dashboard.discounts.discountPercentage')}</TableHead>
                                <TableHead className="text-right">{t('dashboard.common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areProductsLoading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {products && products.map(product => (
                                <DiscountRow key={product.id} product={product} onUpdate={refetch} />
                            ))}
                        </TableBody>
                    </Table>
                    {!areProductsLoading && products?.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            {t('dashboard.discounts.noProducts')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

