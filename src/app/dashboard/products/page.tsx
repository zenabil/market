'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'products')), [firestore]);
  const { data: products, isLoading: areProductsLoading, refetch } = useCollection<Product>(productsQuery);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  React.useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
        router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
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
      toast({ title: 'Produit supprimé' });
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
        title: 'Erreur de suppression',
        description: 'Vous n\'avez peut-être pas la permission de faire cela.',
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
  
  const isLoading = areProductsLoading || isRoleLoading;

  if (isLoading || !isAdmin) {
      return (
          <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="container py-8 md:py-12">
        <div className="overflow-x-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gérer les produits</CardTitle>
                <Button asChild size="sm" className="gap-1">
                  <Link href="/dashboard/products/new">
                    <PlusCircle className="h-4 w-4" />
                    Ajouter un produit
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Prix d'achat</TableHead>
                      <TableHead>Prix de vente</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Vendus</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areProductsLoading && Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                    {products && products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{formatCurrency(product.purchasePrice)}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>{product.sold}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ouvrir le menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/products/edit/${product.id}`}>Modifier</Link>
                              </DropdownMenuItem>
                               <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(product); }} className="text-destructive">
                                 <Trash2 className="mr-2 h-4 w-4" />
                                 Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                 {!areProductsLoading && products?.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        Aucun produit trouvé.
                    </div>
                )}
              </CardContent>
            </Card>
        </div>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera définitivement le produit "{productToDelete?.name || ''}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setProductToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}
