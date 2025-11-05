'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';

export default function LoyaltyPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.nav.loyalty')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('dashboard.coming_soon')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
