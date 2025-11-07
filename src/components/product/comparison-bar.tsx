'use client';

import React from 'react';
import { useComparison } from '@/hooks/use-comparison';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { X, GitCompareArrows } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-provider';

export default function ComparisonBar() {
  const { t } = useLanguage();
  const { items, removeFromComparison, clearComparison } = useComparison();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-12 duration-500">
      <Card className="container mx-auto shadow-2xl">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold hidden sm:block">{t('compare.bar.title')}</h3>
            <div className="flex items-center gap-2">
              {items.map(item => (
                <div key={item.id} className="relative group">
                  <Image
                    src={item.images[0]}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md border object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeFromComparison(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild disabled={items.length < 2}>
              <Link href="/compare">
                <GitCompareArrows className="mr-2 h-4 w-4" />
                {t('compare.bar.compareButton').replace('{{count}}', items.length.toString())}
              </Link>
            </Button>
            <Button variant="ghost" onClick={clearComparison}>
              {t('compare.bar.clear')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
