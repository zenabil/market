
import type { Metadata } from 'next';
import ContactPageClient from './contact-client';

export const metadata: Metadata = {
  title: 'Contactez-nous',
  description: 'Contactez Tlemcen Smart Supermarket pour toute question, suggestion ou demande d\'assistance.',
};

export default function ContactPage() {
    return <ContactPageClient />;
}
