'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/placeholder-data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useUserRole } from '@/hooks/use-user-role';
import { useOrders } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { createNotification } from '@/lib/services/notification';
import { useLanguage } from '@/contexts/language-provider';

const orderStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

function AdminOrdersView({ orders, isLoading, onUpdate }: { orders: Order[] | null, isLoading: boolean, onUpdate: () => void }) {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [updatingStatusId, setUpdatingStatusId] = React.useState<string | null>(null);

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

    const handleStatusChange = (order: Order, newStatus: string) => {
        if (!firestore) return;
        setUpdatingStatusId(order.id);
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
                 onUpdate();
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
                setUpdatingStatusId(null);
            });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline text-3xl'>{t('dashboard.orders.admin.title')}</CardTitle>
                <CardDescription>{t('dashboard.orders.admin.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('dashboard.orders.table.orderId')}</TableHead>
                            <TableHead>{t('dashboard.orders.table.customer')}</TableHead>
                            <TableHead>{t('dashboard.orders.table.date')}</TableHead>
                            <TableHead>{t('dashboard.orders.table.status')}</TableHead>
                            <TableHead className="text-right">{t('dashboard.orders.table.total')}</TableHead>
                            <TableHead><span className="sr-only">{t('dashboard.common.actions')}</span></TableHead>
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
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {orders && orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono text-sm text-muted-foreground">...{order.id.slice(-12)}</TableCell>
                                <TableCell>{order.shippingAddress.split(',')[0]}</TableCell>
                                <TableCell>{formatDate(order.orderDate)}</TableCell>
                                <TableCell>
                                    <div className='flex items-center gap-2'>
                                        {updatingStatusId === order.id && <Loader2 className="h-4 w-4 animate-spin" />}
                                        <Badge variant={getStatusVariant(order.status)}>{t(`dashboard.orders.status.${order.status}`)}</Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={updatingStatusId === order.id}>
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">{t('dashboard.common.openMenu')}</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>{t('dashboard.common.actions')}</DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/orders/${order.id}`}>{t('dashboard.orders.actions.viewDetails')}</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>{t('dashboard.orders.actions.changeStatus')}</DropdownMenuLabel>
                                            {orderStatuses.map(status => (
                                                <DropdownMenuItem
                                                    key={status}
                                                    disabled={order.status === status || !!updatingStatusId}
                                                    onClick={() => handleStatusChange(order, status)}
                                                >
                                                    {t(`dashboard.orders.actions.markAs${status}`)}
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
                        {t('dashboard.orders.noOrders.admin')}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function UserOrdersView({ orders, isLoading }: { orders: Order[] | null, isLoading: boolean }) {
    const { t } = useLanguage();
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
    
    return (
         <Card>
            <CardHeader>
                <CardTitle className='font-headline text-3xl'>{t('dashboard.orders.user.title')}</CardTitle>
                <CardDescription>{t('dashboard.orders.user.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('dashboard.orders.table.orderId')}</TableHead>
                            <TableHead>{t('dashboard.orders.table.date')}</TableHead>
                            <TableHead>{t('dashboard.orders.table.status')}</TableHead>
                            <TableHead className="text-right">{t('dashboard.orders.table.total')}</TableHead>
                            <TableHead><span className="sr-only">{t('dashboard.common.actions')}</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         {isLoading && Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                        {orders && orders.map(order => (
                             <TableRow key={order.id}>
                                <TableCell className="font-mono text-sm text-muted-foreground">...{order.id.slice(-12)}</TableCell>
                                <TableCell>{formatDate(order.orderDate)}</TableCell>
                                <TableCell>
                                     <Badge variant={getStatusVariant(order.status)}>{t(`dashboard.orders.status.${order.status}`)}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/dashboard/orders/${order.id}`}>{t('dashboard.orders.actions.viewDetails')}</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!isLoading && orders?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        {t('dashboard.orders.noOrders.user')}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function OrdersPage() {
    const { isAdmin, isRoleLoading } = useUserRole();
    const { orders, isLoading, refetch } = useOrders();

    const effectiveIsLoading = isRoleLoading || isLoading;

    if (effectiveIsLoading && !orders) {
        return (
            <div className="container py-8 md:py-12">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container py-8 md:py-12">
            {isAdmin ? <AdminOrdersView orders={orders} isLoading={effectiveIsLoading} onUpdate={refetch} /> : <UserOrdersView orders={orders} isLoading={effectiveIsLoading} />}
        </div>
    );
}
