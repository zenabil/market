'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/hooks/use-language';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/placeholder-data';
import { useRouter } from 'next/navigation';

export default function MyOrdersPage() {
  const { t, locale, direction } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'orders'), orderBy('orderDate', 'desc'));
  }, [user, firestore]);

  const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

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
      case 'shipped': return 'secondary';
      case 'delivered': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  }

  if (isUserLoading || !user) {
    return (
        <div className="container py-8 md:py-12">
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-3xl'>{t('nav.my_orders')}</CardTitle>
          <CardDescription>{t('orders.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orders.order_id')}</TableHead>
                <TableHead>{t('orders.date')}</TableHead>
                <TableHead>{t('orders.status')}</TableHead>
                <TableHead className="text-right">{t('orders.total')}</TableHead>
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
              {orders && orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">...{order.id.slice(-12)}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>{t(`orders.status_types.${order.status.toLowerCase()}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!isLoading && orders?.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                {t('orders.no_orders_found')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
