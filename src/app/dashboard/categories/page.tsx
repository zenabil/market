
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, errorEmitter, FirestorePermissionError, useUser } from '@/firebase';
import { doc, addDoc, updateDoc, deleteDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
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
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-provider';

function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}


function CategoryDialog({ category, onActionComplete }: { category?: Category | null, onActionComplete: () => void }) {
  const { t } = useLanguage();

  const categoryFormSchema = z.object({
    name: z.string().min(2, { message: t('dashboard.categories.validation.nameRequired') }),
    image: z.string().url({ message: t('dashboard.categories.validation.imageInvalid') }),
  });

  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      image: '',
    },
  });

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        image: category.image,
      });
    } else {
      form.reset({
        name: '',
        image: 'https://picsum.photos/seed/category/400/400',
      });
    }
  }, [category, form, isOpen]); // Rerun when dialog opens

  async function onSubmit(values: z.infer<typeof categoryFormSchema>) {
    if (!firestore) return;

    setIsSaving(true);
    const categoryData = {
        name: values.name,
        image: values.image,
        slug: slugify(values.name),
    };
    
    const actionPromise = category 
        ? updateDoc(doc(firestore, 'categories', category.id), categoryData)
        : addDoc(collection(firestore, 'categories'), categoryData);

    actionPromise
      .then(() => {
          toast({ title: category ? t('dashboard.categories.toast.updated') : t('dashboard.categories.toast.created') });
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
                {t('dashboard.common.edit')}
            </DropdownMenuItem>
        ) : (
             <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                {t('dashboard.categories.addCategory')}
             </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t('dashboard.categories.editCategory') : t('dashboard.categories.addCategory')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="category-dialog-form">
          <div className="space-y-2">
            <Label>{t('dashboard.categories.name')}</Label>
            <Input {...form.register('name')} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('dashboard.categories.imageUrl')}</Label>
            <Input {...form.register('image')} />
            {form.formState.errors.image && <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>}
          </div>
        </form>
           <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline">{t('dashboard.common.cancel')}</Button>
             </DialogClose>
            <Button type="submit" disabled={isSaving} form="category-dialog-form">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dashboard.common.save')}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function CategoriesPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { categories, areCategoriesLoading, refetchCategories } = useCategories();
  const [categoryToDelete, setCategoryToDelete] = React.useState<Category | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { user } = useUser();
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();
  
  React.useEffect(() => {
      if (!isRoleLoading && !isAdmin) {
          router.replace('/dashboard');
      }
  }, [isAdmin, isRoleLoading, router]);

  const handleDeleteCategory = async () => {
    if (!categoryToDelete || !firestore) return;
    
    setIsDeleting(true);

    // Check if any products are using this category
    const productsQuery = query(collection(firestore, 'products'), where('categoryId', '==', categoryToDelete.id), limit(1));
    const productSnapshot = await getDocs(productsQuery);

    if (!productSnapshot.empty) {
      toast({
        variant: 'destructive',
        title: t('dashboard.categories.deleteError.title'),
        description: t('dashboard.categories.deleteError.description'),
      });
      setIsDeleting(false);
      setIsAlertOpen(false);
      setCategoryToDelete(null);
      return;
    }


    const categoryDocRef = doc(firestore, 'categories', categoryToDelete.id);
    
    try {
      await deleteDoc(categoryDocRef);
      refetchCategories();
      toast({ title: t('dashboard.categories.toast.deleted') });
    } catch (error) {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: categoryDocRef.path,
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
      setCategoryToDelete(null);
      setIsAlertOpen(false);
    }
  };
  
  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsAlertOpen(true);
  }
  
  const isLoading = areCategoriesLoading || isRoleLoading;

  if (isLoading || !isAdmin) {
      return (
          <div className="container py-6 md:py-8 flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="container py-6 md:py-8">
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>{t('dashboard.layout.categories')}</CardTitle>
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
                <TableHead><span className="sr-only">{t('dashboard.common.actions')}</span></TableHead>
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
                        <Image src={category.image} alt={category.name} width={40} height={40} className="rounded-md object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('dashboard.common.openMenu')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <CategoryDialog category={category} onActionComplete={refetchCategories} />
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(category);}} className="text-destructive">
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
            {!areCategoriesLoading && categories?.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                {t('dashboard.categories.noCategories')}
            </div>
            )}
        </CardContent>
        </Card>
        
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{t('dashboard.common.confirmDeleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('dashboard.categories.confirmDeleteDescription').replace('{{name}}', categoryToDelete?.name || '')}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>{t('dashboard.common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCategory} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.common.delete')}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
