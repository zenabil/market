'use client';

import React from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, deleteDoc } from 'firebase/firestore';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function RecipesDashboardPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  const recipesQuery = useMemoFirebase(() => query(collection(firestore, 'recipes')), [firestore]);
  const { data: recipes, isLoading } = useCollection<Recipe>(recipesQuery);
  const [recipeToDelete, setRecipeToDelete] = React.useState<Recipe | null>(null);

  const handleDeleteRecipe = () => {
    if (recipeToDelete && firestore) {
      const recipeDocRef = doc(firestore, 'recipes', recipeToDelete.id);
      deleteDoc(recipeDocRef)
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: recipeDocRef.path,
                    operation: 'delete',
                })
            );
        });
      setRecipeToDelete(null);
    }
  };
  
  return (
    <div className="container py-8 md:py-12">
      <AlertDialog>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>{t('dashboard.nav.recipes')}</CardTitle>
                <CardDescription>{t('dashboard.recipes.description')}</CardDescription>
            </div>
            <Button asChild size="sm" className="gap-1">
              <Link href="/dashboard/recipes/new">
                <PlusCircle className="h-4 w-4" />
                {t('dashboard.recipes.add_recipe')}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t('dashboard.recipes.image')}</TableHead>
                  <TableHead>{t('dashboard.recipes.title')}</TableHead>
                  <TableHead>{t('dashboard.recipes.servings')}</TableHead>
                  <TableHead>{t('dashboard.recipes.total_time')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('dashboard.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
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
                        <Image src={recipe.image} alt={recipe.title[locale]} width={48} height={48} className="rounded-md object-cover aspect-square" />
                    </TableCell>
                    <TableCell className="font-medium">{recipe.title[locale]}</TableCell>
                    <TableCell>{recipe.servings}</TableCell>
                    <TableCell>{t('recipes.minutes', {count: recipe.prepTime + recipe.cookTime})}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('dashboard.toggle_menu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/recipes/edit/${recipe.id}`}>{t('dashboard.edit')}</Link>
                          </DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" onClick={() => setRecipeToDelete(recipe)}>
                                <Trash2 className="mr-2 h-4 w-4" />
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
             {!isLoading && recipes?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    {t('dashboard.recipes.no_recipes')}
                </div>
            )}
          </CardContent>
        </Card>
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dashboard.recipes.delete_confirmation_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dashboard.recipes.delete_confirmation_desc', { recipeName: recipeToDelete?.title[locale] || '' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRecipeToDelete(null)}>{t('dashboard.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteRecipe}>{t('dashboard.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}
