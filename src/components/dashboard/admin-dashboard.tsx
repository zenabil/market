
'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/placeholder-data';
import { TrendingUp, Package, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/language-provider';

export default function AdminDashboard() {
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
        if (typeof product.purchasePrice !== 'number' || product.type === 'bundle') {
            return acc;
        }
        const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
        const profitPerUnit = discountedPrice - product.purchasePrice;
        return acc + (profitPerUnit * (product.sold || 0));
    }, 0);

    const totalProductsSold = allProducts.reduce((acc, product) => acc + (product.sold || 0), 0);
    
    return { totalRevenue, totalProfit, totalProductsSold, productsInStock: allProducts.length };
  }, [allProducts]);
  
  const topSellingChartData = React.useMemo(() => {
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
            <Package className="h-4 w-4 text-muted-foreground" />
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
