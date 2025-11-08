
'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const OrderDetailsClient = dynamic(() => import('./order-details-client'), {
  loading: () => <OrderDetailsSkeleton />,
  ssr: false
});

function OrderDetailsSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
        <div className='space-y-6'>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
    return (
      <Suspense fallback={<OrderDetailsSkeleton />}>
        <OrderDetailsClient />
      </Suspense>
    );
}
