
import type { Metadata } from 'next';
import TermsPageClient from './terms-client';

export const metadata: Metadata = {
    title: 'Conditions d\'utilisation',
    description: 'Lisez les conditions d\'utilisation pour l\'utilisation du site Tlemcen Smart Supermarket.',
     robots: {
        index: true,
        follow: true,
    },
};

export default function TermsPage() {
  return <TermsPageClient />;
}
