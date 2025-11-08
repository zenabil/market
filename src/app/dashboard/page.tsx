
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/use-user-role';
import { useUser } from '@/firebase';
import dynamic from 'next/dynamic';

const AdminDashboard = dynamic(() => import('@/components/dashboard/admin-dashboard'), {
    loading: () => <AdminDashboardSkeleton />,
});

const UserDashboard = dynamic(() => import('@/components/dashboard/user-dashboard'), {
    loading: () => <UserDashboardSkeleton />,
});


function AdminDashboardSkeleton() {
    return (
        <div className="container py-6 md:py-8">
            <div className="h-10 w-64 mb-8 bg-muted rounded-md" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="h-28 bg-muted rounded-md" />
                <div className="h-28 bg-muted rounded-md" />
                <div className="h-28 bg-muted rounded-md" />
                <div className="h-28 bg-muted rounded-md" />
            </div>
            <div className="mt-8">
                <div className="h-96 bg-muted rounded-md" />
            </div>
        </div>
    );
}

function UserDashboardSkeleton() {
     return (
        <div className="container py-6 md:py-8">
            <div className="h-10 w-80 mb-8 bg-muted rounded-md" />
            <div className="grid gap-4 md:grid-cols-3">
                <div className="h-28 bg-muted rounded-md" />
                <div className="h-28 bg-muted rounded-md" />
                <div className="h-28 bg-muted rounded-md" />
            </div>
            <div className="mt-8">
                 <div className="h-80 bg-muted rounded-md" />
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
            <div className="container py-6 md:py-8 flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}
