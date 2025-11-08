
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import React, { Suspense } from 'react';
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
import dynamic from 'next/dynamic';


const AdminDashboard = dynamic(() => import('@/components/dashboard/admin-dashboard'), {
    loading: () => <AdminDashboardSkeleton />,
});

const UserDashboard = dynamic(() => import('@/components/dashboard/user-dashboard'), {
    loading: () => <UserDashboardSkeleton />,
});


function AdminDashboardSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="mt-8">
                <Skeleton className="h-96" />
            </div>
        </div>
    );
}

function UserDashboardSkeleton() {
     return (
        <div className="container py-8 md:py-12">
            <Skeleton className="h-10 w-80 mb-8" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="mt-8">
                 <Skeleton className="h-80" />
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
