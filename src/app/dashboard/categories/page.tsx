'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useCategories } from '@/hooks/use-categories';
import type { Category } from '@/lib/placeholder-data';


const categoryFormSchema = z.object({
  nameAr: z.string().min(2, { message: 'Arabic name is required.' }),
  nameFr: z.string().min(2, { message: 'French name is required.' }),
  nameEn: z.string().min(2, { message: 'English name is required.' }),
  image: z.string().url({ message: 'Please enter a valid image URL.' }),
});

function CategoryDialog({ category, onActionComplete }: { category?: Category | null, onActionComplete: () => void }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      nameAr: '',
      nameFr: '',
      nameEn: '',
      image: '',
    },
  });

  React.useEffect(() => {
    if (category) {
      form.reset({
        nameAr: category.name.ar,
        nameFr: category.name.fr,
        nameEn: category.name.en,
        image: category.image,
      });
    } else {
      form.reset({
        nameAr: '',
        nameFr: '',
        nameEn: '',
        image: 'https://picsum.photos/seed/' + Date.now() + '/400/400',
      });
    }
  }, [category, form, isOpen]); // Rerun when dialog opens

  async function onSubmit(values: z.infer<typeof categoryFormSchema>) {
    if (!firestore) return;

    setIsSaving(true);
    const categoryData = {
        name: {
            ar: values.nameAr,
            fr: values.nameFr,
            en: values.nameEn,
        },
        image: values.image,
    };
    
    const actionPromise = category 
        ? updateDoc(doc(firestore, 'categories', category.id), categoryData)
        : addDoc(collection(firestore, 'categories'), categoryData);

    actionPromise
      .then(() => {
          toast({ title: category ? t('dashboard.categories.updated_title') : t('dashboard.categories.created_title') });
          setIsOpen(false);
          onActionComplete();
      })
      .catch(error => {
          const path = category ? `categories/${category.id}` : 'categories';
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: path,
              operation: category ? 'update' : 'create',
              requestResourceData: categoryData,
            })
          );
      })
      .finally(() => {
          setIsSaving(false);
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {category ? (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" />
                {t('dashboard.edit')}
            </DropdownMenuItem>
        ) : (
             <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t('dashboard.categories.add_category')}
             </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t('dashboard.categories.edit_category') : t('dashboard.categories.add_category')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('dashboard.product_name_ar')}</Label>
            <Input {...form.register('nameAr')} />
            {form.formState.errors.nameAr && <p className="text-sm text-destructive">{form.formState.errors.nameAr.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('dashboard.product_name_en')}</Label>
            <Input {...form.register('nameEn')} />
            {form.formState.errors.nameEn && <p className="text-sm text-destructive">{form.formState.errors.nameEn.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('dashboard.product_name_fr')}</Label>
            <Input {...form.register('nameFr')} />
            {form.formState.errors.nameFr && <p className="text-sm text-destructive">{form.formState.errors.nameFr.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('dashboard.categories.image_url')}</Label>
            <Input {...form.register('image')} />
            {form.formState.errors.image && <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>}
          </div>
           <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline">{t('dashboard.cancel')}</Button>
             </DialogClose>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dashboard.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function CategoriesPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  const { categories, areCategoriesLoading, refetchCategories } = useCategories();
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);

  const handleDeleteCategory = () => {
    if (categoryToDelete && firestore) {
      const categoryDocRef = doc(firestore, 'categories', categoryToDelete.id);
      deleteDoc(categoryDocRef)
        .then(() => {
          refetchCategories();
        })
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: categoryDocRef.path,
                    operation: 'delete',
                })
            );
        });
      setCategoryToDelete(null);
    }
    setIsAlertOpen(false);
  };
  
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsAlertOpen(true);
  }

  return (
    <div className="container py-8 md:py-12">
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.nav.categories')}</CardTitle>
                <CardDescription>{t('dashboard.categories.description')}</CardDescription>
              </div>
              <CategoryDialog onActionComplete={refetchCategories} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.categories.image')}</TableHead>
                    <TableHead>{t('dashboard.categories.name')}</TableHead>
                    <TableHead><span className="sr-only">{t('dashboard.actions')}</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areCategoriesLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))}
                  {categories && categories.map(category => (
                    <TableRow key={category.id}>
                        <TableCell>
                            <Image src={category.image} alt={category.name[locale]} width={40} height={40} className="rounded-md object-cover" />
                        </TableCell>
                      <TableCell className="font-medium">{category.name[locale]}</TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t('dashboard.toggle_menu')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               <CategoryDialog category={category} onActionComplete={refetchCategories} />
                               <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(category);}} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('dashboard.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!areCategoriesLoading && categories?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  {t('dashboard.categories.no_categories')}
                </div>
              )}
            </CardContent>
          </Card>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dashboard.categories.delete_confirmation_title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dashboard.categories.delete_confirmation_desc', { categoryName: categoryToDelete?.name[locale] || '' })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>{t('dashboard.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCategory}>{t('dashboard.delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
