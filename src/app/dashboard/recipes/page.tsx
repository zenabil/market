'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, deleteDoc, getDocs, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Recipe } from '@/lib/placeholder-data';
import Image from 'next/image';
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

export default function RecipesDashboardPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const recipesQuery = useMemoFirebase(() => query(collection(firestore, 'recipes')), [firestore]);
  const { data: recipes, isLoading: areRecipesLoading, refetch: refetchRecipes } = useCollection<Recipe>(recipesQuery);
  const [recipeToDelete, setRecipeToDelete] = React.useState<Recipe | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();
  
  React.useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
        router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete || !firestore) return;

    setIsDeleting(true);
    
    // Check for reviews before deleting
    const reviewsRef = collection(firestore, `recipes/${recipeToDelete.id}/reviews`);
    const reviewsQuery = query(reviewsRef, limit(1));
    const reviewSnapshot = await getDocs(reviewsQuery);

    if (!reviewSnapshot.empty) {
        toast({
            variant: 'destructive',
            title: t('dashboard.recipes.deleteError.title'),
            description: t('dashboard.recipes.deleteError.description'),
        });
        setIsDeleting(false);
        setIsAlertOpen(false);
        setRecipeToDelete(null);
        return;
    }
    
    const recipeDocRef = doc(firestore, 'recipes', recipeToDelete.id);
    try {
      await deleteDoc(recipeDocRef);
      toast({ title: t('dashboard.recipes.toast.deleted') });
      refetchRecipes();
    } catch (error) {
      errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
              path: recipeDocRef.path,
              operation: 'delete',
          })
      );
      toast({
        variant: 'destructive',
        title: t('dashboard.common.deleteErrorTitle'),
        description: t('dashboard.common.permissionError'),
      });
    } finally {
      setIsDeleting(false);
      setRecipeToDelete(null);
      setIsAlertOpen(false);
    }
  };

    const openDeleteDialog = (recipe: Recipe) => {
        setRecipeToDelete(recipe);
        setIsAlertOpen(true);
    };

  
  const isLoading = areRecipesLoading || isRoleLoading;

  if (isLoading || !isAdmin) {
      return (
          <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="container py-8 md:py-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{t('dashboard.layout.recipes')}</CardTitle>
                <CardDescription>{t('dashboard.recipes.description')}</CardDescription>
            </div>
            <Button asChild size="sm" className="gap-1">
              <Link href="/dashboard/recipes/new">
                <PlusCircle className="h-4 w-4" />
                {t('dashboard.recipes.addRecipe')}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t('dashboard.recipes.table.image')}</TableHead>
                  <TableHead>{t('dashboard.recipes.table.title')}</TableHead>
                  <TableHead>{t('dashboard.recipes.table.servings')}</TableHead>
                  <TableHead>{t('dashboard.recipes.table.totalTime')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('dashboard.common.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areRecipesLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {recipes && recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell>
                        <Image src={recipe.image} alt={recipe.title} width={48} height={48} className="rounded-md object-cover aspect-square" />
                    </TableCell>
                    <TableCell className="font-medium">{recipe.title}</TableCell>
                    <TableCell>{recipe.servings}</TableCell>
                    <TableCell>{recipe.prepTime + recipe.cookTime} min</TableCell>
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
                            <Link href={`/dashboard/recipes/edit/${recipe.id}`}>{t('dashboard.common.edit')}</Link>
                          </DropdownMenuItem>
                             <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(recipe); }} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('dashboard.common.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {!areRecipesLoading && recipes?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    {t('dashboard.recipes.noRecipes')}
                </div>
            )}
          </CardContent>
        </Card>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dashboard.common.confirmDeleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                 {t('dashboard.recipes.confirmDeleteDescription').replace('{{name}}', recipeToDelete?.title || '')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRecipeToDelete(null)}>{t('dashboard.common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRecipe} disabled={isDeleting}>
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dashboard.common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}
