
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as FirestoreUser } from '@/lib/placeholder-data';
import { ShoppingBasket, Gem } from 'lucide-react';
import { useLanguage } from '@/contexts/language-provider';
import { useOrders } from '@/hooks/use-orders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserDashboard() {
    const { t } = useLanguage();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { orders, isLoading: areOrdersLoading } = useOrders();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(collection(firestore, 'users'), user.uid);
    }, [firestore, user]);

    const { data: firestoreUser, isLoading: isFirestoreUserLoading } = useDoc<FirestoreUser>(userDocRef);
    
    const recentOrders = orders?.slice(0, 5) || [];

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
    
    const isLoading = isUserLoading || isFirestoreUserLoading || areOrdersLoading;

    return (
        <div className="container py-8 md:py-12">
            <h1 className="font-headline text-3xl md:text-4xl mb-8">{t('dashboard.user.welcome', { name: firestoreUser?.name || 'User' })}</h1>
            <div className="grid gap-4 md:grid-cols-3">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.user.totalOrders')}</CardTitle>
                        <ShoppingBasket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{firestoreUser?.orderCount || 0}</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.users.totalSpent')}</CardTitle>
                         <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            className="h-4 w-4 text-muted-foreground"
                            >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{formatCurrency(firestoreUser?.totalSpent || 0)}</div>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dashboard.profile.loyaltyPoints')}</CardTitle>
                        <Gem className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{firestoreUser?.loyaltyPoints || 0}</div>}
                    </CardContent>
                </Card>
            </div>
            <div className="mt-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.user.recentOrders')}</CardTitle>
                        <CardDescription>{t('dashboard.user.recentOrdersDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('dashboard.orders.table.orderId')}</TableHead>
                                    <TableHead>{t('dashboard.orders.table.date')}</TableHead>
                                    <TableHead>{t('dashboard.orders.table.status')}</TableHead>
                                    <TableHead className="text-right">{t('dashboard.orders.table.total')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {isLoading && Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && recentOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-sm">
                                            <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">...{order.id.slice(-12)}</Link>
                                        </TableCell>
                                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(order.status)}>{t(`dashboard.orders.status.${order.status}`)}</Badge></TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                         {!isLoading && recentOrders.length === 0 && (
                            <div className="text-center p-8 text-muted-foreground">
                                {t('dashboard.orders.noOrders.user')}
                                <Button asChild variant="link"><Link href="/products">{t('home.shopNow')}</Link></Button>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
