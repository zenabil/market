'use client';

import { getProducts } from '@/lib/placeholder-data';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductsPage() {
  const { t, locale } = useLanguage();
  const products = getProducts();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };
  
  return (
    <div className="container py-8 md:py-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('dashboard.manage_products')}</CardTitle>
            <Button asChild size="sm" className="gap-1">
              <Link href="/dashboard/products/new">
                <PlusCircle className="h-4 w-4" />
                {t('dashboard.add_product')}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.product')}</TableHead>
                  <TableHead>{t('dashboard.price')}</TableHead>
                  <TableHead>{t('dashboard.stock')}</TableHead>
                  <TableHead>{t('dashboard.sold')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('dashboard.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name[locale]}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{product.sold}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('dashboard.toggle_menu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>{t('dashboard.edit')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">{t('dashboard.delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  )
}
