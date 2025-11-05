'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/hooks/use-language';
import { useFirestore, useCollectionGroup, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/placeholder-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const orderStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore]);

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
      case 'confirmed': return 'secondary';
      case 'shipped': return 'default';
      case 'delivered': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, `users/${order.userId}/orders`, order.id);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({
      title: t('dashboard.orders.status_updated_title'),
      description: t('dashboard.orders.status_updated_desc', { orderId: order.id.slice(-6), status: t(`orders.status_types.${newStatus.toLowerCase()}`) }),
    });
  };

  return (
    <div className="container py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-3xl'>{t('dashboard.nav.orders')}</CardTitle>
          <CardDescription>{t('dashboard.orders.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orders.order_id')}</TableHead>
                <TableHead>{t('dashboard.orders.customer')}</TableHead>
                <TableHead>{t('orders.date')}</TableHead>
                <TableHead>{t('orders.status')}</TableHead>
                <TableHead className="text-right">{t('orders.total')}</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
              {orders && orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">...{order.id.slice(-12)}</TableCell>
                  <TableCell>{order.userId.slice(0, 15)}...</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>{t(`orders.status_types.${order.status.toLowerCase()}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('dashboard.toggle_menu')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t('dashboard.orders.view_details')}</DropdownMenuItem>
                          {orderStatuses.map(status => (
                            <DropdownMenuItem 
                              key={status} 
                              disabled={order.status === status}
                              onClick={() => handleStatusChange(order, status)}
                            >
                              {t('dashboard.orders.mark_as')} {t(`orders.status_types.${status.toLowerCase()}`)}
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
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
