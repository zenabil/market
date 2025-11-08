

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardLayoutClient = dynamic(() => import('./dashboard-layout-client'), {
    loading: () => (
        <div className="flex h-screen w-full bg-muted/40">
            <div className="w-14 md:w-64 border-r p-2">
                <div className="flex items-center p-2 mb-4">
                    <Skeleton className="h-8 w-8 mr-2 rounded-full" />
                    <Skeleton className="h-6 w-32 hidden md:block" />
                </div>
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex items-center p-2">
                             <Skeleton className="h-6 w-6 mr-2" />
                             <Skeleton className="h-4 w-24 hidden md:block" />
                        </div>
                    ))}
                </div>
            </div>
             <div className="flex-1 p-8">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    )
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutClient>{children}</DashboardLayoutClient>
  );
}
