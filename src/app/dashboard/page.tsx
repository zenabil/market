
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import type { Product, User as FirestoreUser, Order } from '@/lib/placeholder-data';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, ShoppingBasket, Gem } from 'lucide-react';
import { useUserRole } from '@/hooks/use-user-role';
import { useLanguage } from '@/contexts/language-provider';
import { useOrders } from '@/hooks/use-orders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function AdminDashboard() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const allProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);
  
  const { data: allProducts, isLoading: isAllProductsLoading } = useCollection<Product>(allProductsQuery);

  const topSellingQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('sold', '>', 0), orderBy('sold', 'desc'), limit(5));
  }, [firestore]);

  const { data: topSellingProducts, isLoading: isTopSellingLoading } = useCollection<Product>(topSellingQuery);

  const stats = React.useMemo(() => {
    if (!allProducts) {
      return {
        totalRevenue: 0,
        totalProfit: 0,
        totalProductsSold: 0,
        productsInStock: 0,
      };
    }
    const totalRevenue = allProducts.reduce((acc, product) => {
      const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
      return acc + discountedPrice * (product.sold || 0);
    }, 0);
    
    const totalProfit = allProducts.reduce((acc, product) => {
        if (typeof product.purchasePrice !== 'number') {
            return acc; // Skip products without a valid purchase price
        }
        const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
        const profitPerUnit = discountedPrice - product.purchasePrice;
        return acc + (profitPerUnit * (product.sold || 0));
    }, 0);

    const totalProductsSold = allProducts.reduce((acc, product) => acc + (product.sold || 0), 0);
    
    return { totalRevenue, totalProfit, totalProductsSold, productsInStock: allProducts.length };
  }, [allProducts]);
  
  const topSellingChartData = useMemo(() => {
      if (!topSellingProducts) return [];
      return topSellingProducts.map(p => ({ name: p.name || '', sold: p.sold }));
  }, [topSellingProducts]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(t('locale'), {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };
  
  const chartConfig = {
    sold: {
      label: t('dashboard.admin.unitsSold'),
      color: 'hsl(var(--chart-1))',
    },
  };

  const isLoading = isAllProductsLoading || isTopSellingLoading;

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-headline text-3xl md:text-4xl mb-8">{t('dashboard.admin.overview')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.admin.totalRevenue')}</CardTitle>
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
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.admin.totalProfit')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">{formatCurrency(stats.totalProfit)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.admin.productsSold')}</CardTitle>
             <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-muted-foreground"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16" />
              </svg>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stats.totalProductsSold}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.admin.productsInStock')}</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{stats.productsInStock}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.admin.topSellingProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="min-h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-[95%]" />
                </div>
            ) : topSellingChartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={topSellingChartData} layout="vertical" margin={{ right: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        tickLine={false}
                        axisLine={false}
                        tick={{ dx: -5, fontSize: '12px' }}
                        interval={0}
                    />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="sold" fill="var(--color-sold)" radius={4} />
                    </BarChart>
                </ResponsiveContainer>
                </ChartContainer>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                {t('dashboard.admin.noSalesData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UserDashboard() {
    const { t } = useLanguage();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { orders, isLoading: areOrdersLoading } = useOrders();

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users');
    }, [firestore, user]);

    const { data: firestoreUser, isLoading: isFirestoreUserLoading } = useDoc<FirestoreUser>(userDocRef ? doc(userDocRef, user?.uid) : null);
    
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

export default function DashboardPage() {
    const { user, isUserLoading } = useUser();
    const { isAdmin, isRoleLoading } = useUserRole();
    
    const isLoading = isUserLoading || isRoleLoading;

    if (isLoading) {
        return (
            <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}

    