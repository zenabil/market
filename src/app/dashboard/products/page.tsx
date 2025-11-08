'use client';

import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Loader2, Search, Box } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-provider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import { Badge } from '@/components/ui/badge';

export default function ProductsPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: areProductsLoading, refetch } = useCollection<Product>(productsQuery);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  const { categories, areCategoriesLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
        router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategoryId || product.categoryId === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryId]);

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat(t('locale'), {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !firestore) return;
    
    setIsDeleting(true);
    const productDocRef = doc(firestore, 'products', productToDelete.id);
    try {
      await deleteDoc(productDocRef);
      toast({ title: t('dashboard.products.toast.deleted') });
      refetch(); // Refetch the product list
    } catch (error) {
      errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
              path: productDocRef.path,
              operation: 'delete',
          })
      );
      toast({
        variant: 'destructive',
        title: t('dashboard.products.deleteError.title'),
        description: t('dashboard.products.deleteError.description'),
      });
    } finally {
      setProductToDelete(null);
      setIsAlertOpen(false);
      setIsDeleting(false);
    }
  };
  
  const openDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  }
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoryId(null);
  }
  
  const isLoading = areProductsLoading || isRoleLoading || areCategoriesLoading;

  if (isLoading || !isAdmin) {
      return (
          <div className="container py-6 md:py-8 flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="container py-6 md:py-8">
        <div>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>{t('dashboard.products.pageTitle')}</CardTitle>
                    <CardDescription>
                      {t('dashboard.products.pageDescription', { count: filteredProducts.length, total: products?.length || 0 })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button size="sm" className="gap-1">
                            <PlusCircle className="h-4 w-4" />
                            {t('dashboard.products.addProduct')}
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild><Link href="/dashboard/products/new?type=standard">Produit standard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboard/products/new?type=bundle">Offre groupée (Bundle)</Link></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                 <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder={t('dashboard.products.searchPlaceholder')}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                      />
                  </div>
                   <Select
                        value={selectedCategoryId || 'all'}
                        onValueChange={(value) => setSelectedCategoryId(value === 'all' ? null : value)}
                    >
                        <SelectTrigger className="sm:w-[200px]">
                            <SelectValue placeholder={t('dashboard.products.filterByCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('dashboard.products.allCategories')}</SelectItem>
                            {categories?.map(category => (
                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(searchTerm || selectedCategoryId) && (
                        <Button variant="ghost" onClick={resetFilters}>{t('dashboard.products.resetFilters')}</Button>
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.discounts.product')}</TableHead>
                        <TableHead>{t('dashboard.products.sellingPrice')}</TableHead>
                        <TableHead>{t('dashboard.products.stock')}</TableHead>
                        <TableHead>{t('dashboard.products.sold')}</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>
                          <span className="sr-only">{t('dashboard.common.actions')}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {areProductsLoading && Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))}
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{product.sold}</TableCell>
                          <TableCell>{product.type === 'bundle' ? <Badge variant="secondary">Bundle</Badge> : <Badge variant="outline">Standard</Badge>}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">{t('dashboard.common.openMenu')}</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/products/edit/${product.id}`}>{t('dashboard.products.edit')}</Link>
                                </DropdownMenuItem>
                                 <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(product); }} className="text-destructive">
                                   <Trash2 className="mr-2 h-4 w-4" />
                                   {t('dashboard.products.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {areProductsLoading && Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    ))}
                    {filteredProducts.map((product) => (
                        <Card key={product.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{product.name}</CardTitle>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" className="-mt-2 -mr-2">
                                            <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild><Link href={`/dashboard/products/edit/${product.id}`}>{t('dashboard.products.edit')}</Link></DropdownMenuItem>
                                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(product); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />{t('dashboard.products.delete')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('dashboard.products.sellingPrice')}</span>
                                    <span className="font-medium">{formatCurrency(product.price)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('dashboard.products.stock')}</span>
                                    <span>{product.stock}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('dashboard.products.sold')}</span>
                                    <span>{product.sold}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                 {!areProductsLoading && filteredProducts.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        {products && products.length > 0
                            ? t('dashboard.products.noFilterResults')
                            : t('dashboard.products.noProducts')
                        }
                    </div>
                )}
              </CardContent>
            </Card>
        </div>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dashboard.common.confirmDeleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dashboard.products.deleteConfirm').replace('{{name}}', productToDelete?.name || '')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProductToDelete(null)}>{t('dashboard.common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dashboard.products.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}
