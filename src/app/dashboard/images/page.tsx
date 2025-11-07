'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, collection, query } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useCollection, useMemoFirebase } from '@/firebase';
import type { SiteImage } from '@/lib/placeholder-data';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-provider';


function ImageEditDialog({ image, onActionComplete, children }: { image: SiteImage, onActionComplete: () => void, children: React.ReactNode }) {
  const { t } = useLanguage();
  const imageFormSchema = z.object({
    imageUrl: z.string().url({ message: t('dashboard.products.validation.imageURL') }),
    description: z.string().min(5, { message: "La description est requise."}),
    imageHint: z.string().optional(),
  });
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof imageFormSchema>>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      imageUrl: image.imageUrl,
      description: image.description,
      imageHint: image.imageHint,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        imageUrl: image.imageUrl,
        description: image.description,
        imageHint: image.imageHint,
      });
    }
  }, [image, form, isOpen]);

  async function onSubmit(values: z.infer<typeof imageFormSchema>) {
    if (!firestore) return;

    setIsSaving(true);
    
    const imageRef = doc(firestore, 'siteImages', image.id);
    updateDoc(imageRef, values)
      .then(() => {
          toast({ title: "Image mise à jour" });
          setIsOpen(false);
          onActionComplete();
      })
      .catch(error => {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: imageRef.path,
              operation: 'update',
              requestResourceData: values,
            })
          );
      })
      .finally(() => {
          setIsSaving(false);
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'image : {image.id}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id={`image-dialog-form-${image.id}`}>
          <div className="space-y-2">
            <Label>URL de l'image</Label>
            <Input {...form.register('imageUrl')} />
            {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
          </div>
           <div className="space-y-2">
            <Label>Description (pour l'accessibilité)</Label>
            <Input {...form.register('description')} />
            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Indice pour l'IA</Label>
            <Input {...form.register('imageHint')} />
            {form.formState.errors.imageHint && <p className="text-sm text-destructive">{form.formState.errors.imageHint.message}</p>}
          </div>
        </form>
           <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline">{t('dashboard.common.cancel')}</Button>
             </DialogClose>
            <Button type="submit" disabled={isSaving} form={`image-dialog-form-${image.id}`}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('dashboard.common.save')}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function SiteImagesPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const imagesQuery = useMemoFirebase(() => query(collection(firestore, 'siteImages')), [firestore]);
  const { data: siteImages, isLoading: areImagesLoading, refetch } = useCollection<SiteImage>(imagesQuery);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();
  
  React.useEffect(() => {
      if (!isRoleLoading && !isAdmin) {
          router.replace('/dashboard');
      }
  }, [isAdmin, isRoleLoading, router]);
  
  const isLoading = areImagesLoading || isRoleLoading;

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
            <CardTitle>Gestion des Images du Site</CardTitle>
            <CardDescription>Modifiez les images clés utilisées sur votre site, comme le carrousel.</CardDescription>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Aperçu</TableHead>
                <TableHead>ID de l'image</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Indice IA</TableHead>
                <TableHead><span className="sr-only">{t('dashboard.common.actions')}</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {areImagesLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-16 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
                ))}
                {siteImages && siteImages.map(image => (
                <TableRow key={image.id}>
                    <TableCell>
                        <Image src={image.imageUrl} alt={image.description} width={64} height={40} className="rounded-md object-cover" />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{image.id}</TableCell>
                    <TableCell>{image.description}</TableCell>
                    <TableCell className="font-mono text-xs">{image.imageHint}</TableCell>
                    <TableCell className="text-right">
                         <ImageEditDialog image={image} onActionComplete={refetch}>
                            <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </ImageEditDialog>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
            {!areImagesLoading && siteImages?.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                Aucune image de site trouvée.
            </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
