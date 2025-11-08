

'use client';

import React, { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase, useCollectionGroup, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
import { doc, collection, query, where, documentId, collectionGroup, updateDoc, addDoc } from 'firebase/firestore';
import type { Order, Product, User as FirestoreUser } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Package, User, Truck, CheckCircle, XCircle, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { AddressDialog } from '@/components/dashboard/address-dialog';
import { createNotification } from '@/lib/services/notification';
import { useLanguage } from '@/contexts/language-provider';

const orderStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrderDetailsClient() {
    const { t } = useLanguage();
    const { id: orderId } = useParams();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

    const orderQuery = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return query(collectionGroup(firestore, 'orders'), where(documentId(), '==', orderId as string));
    }, [firestore, orderId]);
    
    const { data: orders, isLoading: isOrderLoading, refetch: refetchOrder } = useCollection<Order>(orderQuery);
    
    const order = useMemo(() => {
        return orders && orders.length === 1 ? orders[0] : null;
    }, [orders]);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !order) return null;
        return doc(firestore, 'users', order.userId);
    }, [firestore, order]);

    const { data: customer, isLoading: isCustomerLoading, refetch: refetchCustomer } = useDoc<FirestoreUser>(userDocRef);

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

    const handleStatusChange = (newStatus: string) => {
        if (!firestore || !order) return;
        setIsUpdatingStatus(true);
        const orderRef = doc(firestore, `users/${order.userId}/orders`, order.id);
        const updateData = { status: newStatus };
        updateDoc(orderRef, updateData)
            .then(() => {
                toast({
                    title: t('dashboard.orders.details.toast.statusUpdated.title'),
                    description: t('dashboard.orders.details.toast.statusUpdated.description').replace('{{status}}', t(`dashboard.orders.status.${newStatus}`)),
                });
                 createNotification(firestore, order.userId, {
                    message: t('dashboard.orders.notification.statusUpdate', {id: order.id.slice(-6), status: t(`dashboard.orders.status.${newStatus}`)}),
                    link: `/dashboard/orders/${order.id}`,
                 });
                 refetchOrder();
            })
            .catch(error => {
                errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: orderRef.path,
                        operation: 'update',
                        requestResourceData: updateData,
                    })
                );
            })
            .finally(() => {
                setIsUpdatingStatus(false);
            });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(t('locale'), { style: 'currency', currency: 'DZD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(t('locale'), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    };
    
    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'Pending': return 'default';
            case 'Confirmed': return 'secondary';
            case 'Shipped': return 'default';
            case 'Delivered': return 'outline';
            case 'Cancelled': return 'destructive';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        if (isUpdatingStatus) return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
        switch (status) {
            case 'Pending': return <User className="h-4 w-4 mr-2" />;
            case 'Confirmed': return <CheckCircle className="h-4 w-4 mr-2" />;
            case 'Shipped': return <Truck className="h-4 w-4 mr-2" />;
            case 'Delivered': return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
            case 'Cancelled': return <XCircle className="h-4 w-4 mr-2" />;
            default: return <Package className="h-4 w-4 mr-2" />;
        }
    };
    
    const isLoading = isOrderLoading || isCustomerLoading || (order && areProductsLoading);

    if (isLoading) {
        return null;
    }
    
    if (!order) {
        return notFound();
    }


    return (
        <div className="container py-8 md:py-12">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    </Button>
                    <div>
                        <h1 className="font-headline text-3xl md:text-4xl">{t('dashboard.orders.details.title')}</h1>
                         <p className="text-muted-foreground font-mono text-sm">
                            {t('dashboard.orders.details.id')}: {order.id}
                        </p>
                    </div>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={isUpdatingStatus}>
                            {getStatusIcon(order.status)}
                            {t(`dashboard.orders.status.${order.status}`)}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('dashboard.orders.details.changeStatus')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {orderStatuses.map(status => (
                            <DropdownMenuItem
                                key={status}
                                disabled={order.status === status || isUpdatingStatus}
                                onClick={() => handleStatusChange(status)}
                            >
                                {t(`dashboard.orders.actions.markAs${status}`)}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'><Package /> {t('dashboard.orders.details.items')} ({order.items.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map(item => {
                                    const product = productsMap.get(item.productId);
                                    return (
                                        <div key={item.productId} className="flex justify-between items-center">
                                            <div className='flex items-center gap-4'>
                                                 <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 relative overflow-hidden">
                                                    {product ? <Link href={`/product/${product.slug}`}><Image src={product.images[0]} alt={product.name} fill className="object-cover" /></Link> : <div className="w-full h-full bg-muted" />}
                                                </div>
                                                <div>
                                                    <Link href={`/product/${product?.slug}`} className="font-medium hover:underline">{item.productName}</Link>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.quantity} x {formatCurrency(item.price)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-medium text-right">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    )
                                })}
                                 <Separator />
                                <div className="flex justify-end font-bold text-lg">
                                    <span>{t('dashboard.orders.details.total')}: {formatCurrency(order.totalAmount)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center justify-between'>
                                <span className='flex items-center gap-2'><User /> {t('dashboard.orders.details.customer')}</span>
                                {customer && userDocRef && (
                                    <AddressDialog 
                                        userDocRef={userDocRef} 
                                        firestoreUser={customer}
                                        onAddressChange={refetchCustomer}
                                    >
                                        <Button variant="ghost" size="icon" title={t('dashboard.orders.details.editAddresses')}>
                                            <Home className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </AddressDialog>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                           {isCustomerLoading ? (
                               <div className="space-y-2">
                                   <div className="h-5 w-3/4 bg-muted rounded" />
                                   <div className="h-4 w-full bg-muted rounded" />
                               </div>
                           ) : customer ? (
                                <>
                                 <p className="font-semibold">{customer.name}</p>
                                 <p className="text-sm text-muted-foreground">{customer.email}</p>
                                </>
                           ): (
                               <p className="text-sm text-muted-foreground">{t('dashboard.orders.details.notFound')}</p>
                           )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'><FileText/> {t('dashboard.orders.details.summary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('dashboard.orders.details.date')}</span>
                                <span>{formatDate(order.orderDate)}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">{t('dashboard.orders.details.status')}</span>
                                <Badge variant={getStatusVariant(order.status)}>{t(`dashboard.orders.status.${order.status}`)}</Badge>
                            </div>
                             <Separator />
                             <div>
                                 <h4 className="font-semibold mb-2">{t('dashboard.orders.details.shippingAddress')}</h4>
                                 <p className='text-sm text-muted-foreground whitespace-pre-line'>{order.shippingAddress.replace(/, /g, '\n')}</p>
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    
