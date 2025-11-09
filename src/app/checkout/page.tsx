

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const CheckoutPageClient = dynamic(() => import('./checkout-client'), {
    ssr: false,
    loading: () => <CheckoutPageSkeleton />
});

export const metadata: Metadata = {
    title: 'Paiement',
    description: 'Finalisez votre commande rapidement et en toute sécurité.',
};


export default function CheckoutPage() {
    return (
        <Suspense fallback={<CheckoutPageSkeleton />}>
            <CheckoutPageClient />
        </Suspense>
    );
}

function CheckoutPageSkeleton() {
    return (
        <div className="container py-6 md:py-8">
            <div className="text-center mb-12">
                <Skeleton className="h-12 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-1/4 mx-auto mt-4" />
            </div>
            <div className="grid lg:grid-cols-2 gap-12">
                <div>
                     <Skeleton className="h-96 w-full" />
                </div>
                <div>
                     <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
        </div>
    )
}
