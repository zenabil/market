

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const ContactPageClient = dynamic(() => import('./contact-client'), {
    loading: () => <ContactPageSkeleton />,
});

export const metadata: Metadata = {
  title: 'Contactez-nous',
  description: 'Contactez Tlemcen Smart Supermarket pour toute question, suggestion ou demande d\'assistance.',
};

export default function ContactPage() {
    return (
      <Suspense fallback={<ContactPageSkeleton />}>
        <ContactPageClient />
      </Suspense>
    );
}


function ContactPageSkeleton() {
    return (
        <div className="container py-8 md:py-12">
            <div className="text-center mb-12">
                <Skeleton className="h-12 w-1/2 mx-auto" />
                <Skeleton className="h-6 w-2/3 mx-auto mt-4" />
            </div>
            <div className="grid md:grid-cols-2 gap-12">
                <Skeleton className="h-[500px] w-full" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    )
}

    