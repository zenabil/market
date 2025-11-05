'use client';

import React, { useEffect, useMemo } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/use-language';
import { useDoc, useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import type { Order, Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Package } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

function OrderDetails() {
    const { id: orderId } = useParams();
    const { t, locale } = useLanguage();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // First, fetch the order by its ID from the orders collection group to find its userId
    const [orderUserId, setOrderUserId] = React.useState<string | null>(null);
    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return query(collection(firestore, `users/${user?.uid}/orders`), where(documentId(), '==', orderId));
    }, [firestore, orderId, user?.uid]);
    const { data: userOrder, isLoading: isUserOrderLoading } = useCollection<Order>(ordersQuery);

    const allOrdersQuery = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return query(collectionGroup(firestore, 'orders'), where(documentId(), '==', orderId as string));
    }, [firestore, orderId]);
    const { data: adminOrder, isLoading: isAdminOrderLoading } = useCollection<Order>(allOrdersQuery);
    
    const orderData = adminOrder?.[0] || userOrder?.[0];

    useEffect(() => {
        if(orderData) {
            setOrderUserId(orderData.userId);
        }
    }, [orderData])


    const orderRef = useMemoFirebase(() => {
        if (!firestore || !orderId || !orderUserId) return null;
        return doc(firestore, `users/${orderUserId}/orders`, orderId as string);
    }, [firestore, orderId, orderUserId]);
    
    const { data: order, isLoading: isOrderLoading } = useDoc<Order>(orderRef);

    const productIds = useMemo(() => {
        if (!order) return null;
        return order.items.map(item => item.productId);
    }, [order]);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !productIds || productIds.length === 0) return null;
        return query(collection(firestore, 'products'), where(documentId(), 'in', productIds));
    }, [firestore, productIds]);

    const { data: products, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

    const productsMap = useMemo(() => {
        if (!products) return new Map();
        return new Map(products.map(p => [p.id, p]));
    }, [products]);
    
    React.useEffect(() => {
      if (!isUserLoading && !user) {
        router.push('/login');
      }
    }, [user, isUserLoading, router]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    };

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'default';
            case 'confirmed': return 'secondary';
            case 'shipped': return 'default';
            case 'delivered': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'default';
        }
    };
    
    const isLoading = isUserLoading || isUserOrderLoading || isAdminOrderLoading || isOrderLoading || (order && areProductsLoading);

    if (isLoading) {
        return (
            <div className="container py-8 md:py-12">
                 <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className='space-y-6'>
                         <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!order) {
        return notFound();
    }


    return (
        <div className="container py-8 md:py-12">
            <div className="flex items-center gap-4 mb-8">
                <Button asChild variant="outline" size="icon">
                <Link href="/dashboard/orders">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                </Button>
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl">{t('orders.order_details')}</h1>
                     <p className="text-muted-foreground font-mono text-sm">
                        {t('orders.order_id')}: {order.id}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'><Package /> {t('orders.order_items')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map(item => {
                                    const product = productsMap.get(item.productId);
                                    return (
                                        <div key={item.productId} className="flex justify-between items-center">
                                            <div className='flex items-center gap-4'>
                                                 <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 relative overflow-hidden">
                                                    {product && <Image src={product.images[0]} alt={product.name[locale]} fill className="object-cover" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.productName[locale]}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t('checkout.quantity')}: {item.quantity} x {formatCurrency(item.price)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-medium text-right">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div>
                     <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'><FileText/> {t('checkout.order_summary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('orders.order_id')}</span>
                                <span className="font-mono text-sm">...{order.id.slice(-12)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('orders.date')}</span>
                                <span>{formatDate(order.orderDate)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{t('orders.status')}</span>
                                <Badge variant={getStatusVariant(order.status)}>{t(`orders.status_types.${order.status.toLowerCase()}`)}</Badge>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>{t('checkout.total')}</span>
                                <span>{formatCurrency(order.totalAmount)}</span>
                            </div>
                             <Separator />
                             <div>
                                 <h4 className="font-semibold mb-2">{t('checkout.shipping_info')}</h4>
                                 <p className='text-sm text-muted-foreground'>{order.shippingAddress}</p>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailsPage() {
    return <OrderDetails />;
}
