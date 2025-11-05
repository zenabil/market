'use client';

import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/placeholder-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ProductsPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };

  const handleDeleteProduct = () => {
    if (productToDelete && firestore) {
      const productDocRef = doc(firestore, 'products', productToDelete.id);
      deleteDocumentNonBlocking(productDocRef);
      setProductToDelete(null);
    }
  };
  
  return (
    <div className="container py-8 md:py-12">
      <AlertDialog>
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
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))}
                {products && products.map((product) => (
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
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/products/edit/${product.id}`}>{t('dashboard.edit')}</Link>
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" onClick={() => setProductToDelete(product)}>
                              {t('dashboard.delete')}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {!isLoading && products?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    {t('dashboard.no_products_found')}
                </div>
            )}
          </CardContent>
        </Card>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dashboard.delete_confirmation_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dashboard.delete_confirmation_desc', { productName: productToDelete?.name[locale] || '' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProductToDelete(null)}>{t('dashboard.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct}>{t('dashboard.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}
