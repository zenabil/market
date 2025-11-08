
import type { Metadata } from 'next';
import PrivacyPageClient from './privacy-client';

export const metadata: Metadata = {
    title: 'Politique de confidentialité',
    description: 'Consultez la politique de confidentialité de Tlemcen Smart Supermarket pour comprendre comment nous protégeons vos données.',
    robots: {
        index: true,
        follow: true,
    },
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
