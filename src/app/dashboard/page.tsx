'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import type { Product } from '@/lib/placeholder-data';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/use-user-role';

function AdminDashboard() {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'));
  }, [firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const stats = React.useMemo(() => {
    if (!products) {
      return {
        totalRevenue: 0,
        totalProductsSold: 0,
        topSellingProducts: [],
        productsInStock: 0,
      };
    }
    const totalRevenue = products.reduce((acc, product) => {
      const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
      return acc + discountedPrice * (product.sold || 0);
    }, 0);

    const totalProductsSold = products.reduce((acc, product) => acc + (product.sold || 0), 0);

    const topSellingProducts = [...products]
      .filter(p => p.sold > 0)
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.name || '',
        sold: p.sold,
      }));
    
    return { totalRevenue, totalProductsSold, topSellingProducts, productsInStock: products.length };
  }, [products]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };
  
  const chartConfig = {
    sold: {
      label: 'Unités vendues',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-headline text-3xl md:text-4xl mb-8">Aperçu</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
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
            <CardTitle className="text-sm font-medium">Produits vendus</CardTitle>
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
            <CardTitle className="text-sm font-medium">Produits en stock</CardTitle>
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
            <CardTitle>Meilleures ventes de produits</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="min-h-[350px] w-full flex items-center justify-center">
                    <Skeleton className="h-[300px] w-[95%]" />
                </div>
            ) : stats.topSellingProducts.length > 0 ? (
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats.topSellingProducts} layout="vertical" margin={{ right: 20, left: 20 }}>
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
                Aucune donnée de vente disponible.
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
    const router = useRouter();
    
    React.useEffect(() => {
        if (isUserLoading || isRoleLoading) {
            return; // Wait until we know the user's status
        }
        if (!user) {
            router.replace('/login');
        } else if (!isAdmin) {
            router.replace('/dashboard/orders');
        }
    }, [user, isUserLoading, isAdmin, isRoleLoading, router]);

    // Show a loading indicator while we verify auth and admin status.
    if (isUserLoading || isRoleLoading || !isAdmin) {
        return (
            <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    // Only render the admin dashboard if the user is confirmed to be an admin.
    return <AdminDashboard />;
}
