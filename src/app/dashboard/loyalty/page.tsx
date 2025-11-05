'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { Gem } from 'lucide-react';

export default function LoyaltyPage() {
  const { t } = useLanguage();

  return (
    <div className="container py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">{t('dashboard.nav.loyalty')}</CardTitle>
          <CardDescription>{t('dashboard.loyalty.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 bg-muted rounded-lg">
            <Gem className="mx-auto h-12 w-12 text-accent" />
            <h3 className="mt-4 text-lg font-semibold">{t('dashboard.loyalty.how_it_works')}</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              {t('dashboard.loyalty.explanation')}
            </p>
          </div>
          <div className="mt-8 text-center">
             <h3 className="text-lg font-semibold">{t('dashboard.loyalty.user_view_title')}</h3>
             <p className="mt-1 text-muted-foreground">{t('dashboard.loyalty.user_view_desc')}</p>
          </div>
           <div className="mt-8 text-center">
             <h3 className="text-lg font-semibold">{t('dashboard.loyalty.admin_view_title')}</h3>
             <p className="mt-1 text-muted-foreground">{t('dashboard.loyalty.admin_view_desc')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
