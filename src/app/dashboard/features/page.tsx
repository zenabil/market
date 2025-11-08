'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Edit, Loader2, Leaf, Truck, Award, Sparkles } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, addDoc, updateDoc, deleteDoc, collection, query } from 'firebase/firestore';
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
import { useCollection, useMemoFirebase } from '@/firebase';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-provider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type StoreFeature = {
    id: string;
    title_fr: string;
    description_fr: string;
    title_ar: string;
    description_ar: string;
    icon: string;
};

const iconOptions = ['Leaf', 'Truck', 'Award', 'Sparkles'];
const iconMap: { [key: string]: React.FC<any> } = {
    Leaf: Leaf,
    Truck: Truck,
    Award: Award,
    Sparkles: Sparkles,
};


function FeatureDialog({ feature, onActionComplete, children }: { feature?: StoreFeature | null, onActionComplete: () => void, children: React.ReactNode }) {
  const { t } = useLanguage();
  const featureFormSchema = z.object({
    title_fr: z.string().min(2, { message: "Titre FR requis" }),
    description_fr: z.string().min(10, { message: "Description FR requise" }),
    title_ar: z.string().min(2, { message: "Titre AR requis" }),
    description_ar: z.string().min(10, { message: "Description AR requise" }),
    icon: z.string({ required_error: "Icône requise" }),
  });
  
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof featureFormSchema>>({
    resolver: zodResolver(featureFormSchema),
    defaultValues: { title_fr: '', description_fr: '', title_ar: '', description_ar: '', icon: 'Leaf' },
  });

  React.useEffect(() => {
    if (isOpen) {
        if (feature) {
          form.reset(feature);
        } else {
          form.reset({ title_fr: '', description_fr: '', title_ar: '', description_ar: '', icon: 'Leaf' });
        }
    }
  }, [feature, form, isOpen]);

  async function onSubmit(values: z.infer<typeof featureFormSchema>) {
    if (!firestore) return;

    setIsSaving(true);
    
    const actionPromise = feature 
        ? updateDoc(doc(firestore, 'storeFeatures', feature.id), values)
        : addDoc(collection(firestore, 'storeFeatures'), values);

    actionPromise
      .then(() => {
          toast({ title: feature ? "Fonctionnalité mise à jour" : "Fonctionnalité ajoutée" });
          setIsOpen(false);
          onActionComplete();
      })
      .catch(error => {
          const path = feature ? `storeFeatures/${feature.id}` : 'storeFeatures';
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({ path, operation: feature ? 'update' : 'create', requestResourceData: values })
          );
      })
      .finally(() => {
          setIsSaving(false);
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{feature ? "Modifier la fonctionnalité" : "Ajouter une fonctionnalité"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id={`feature-dialog-form-${feature?.id || 'new'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Titre (FR)</Label>
                <Input {...form.register('title_fr')} />
                {form.formState.errors.title_fr && <p className="text-sm text-destructive">{form.formState.errors.title_fr.message}</p>}
            </div>
            <div className="space-y-2">
                <Label>Titre (AR)</Label>
                <Input dir="rtl" {...form.register('title_ar')} />
                {form.formState.errors.title_ar && <p className="text-sm text-destructive">{form.formState.errors.title_ar.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label>Description (FR)</Label>
                <Textarea {...form.register('description_fr')} />
                {form.formState.errors.description_fr && <p className="text-sm text-destructive">{form.formState.errors.description_fr.message}</p>}
            </div>
             <div className="space-y-2 md:col-span-2">
                <Label>Description (AR)</Label>
                <Textarea dir="rtl" {...form.register('description_ar')} />
                {form.formState.errors.description_ar && <p className="text-sm text-destructive">{form.formState.errors.description_ar.message}</p>}
            </div>
             <div className="space-y-2">
                <Label>Icône</Label>
                 <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une icône" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iconOptions.map(iconName => {
                             const Icon = iconMap[iconName];
                             return <SelectItem key={iconName} value={iconName}><div className="flex items-center gap-2"><Icon className="h-4 w-4" /> {iconName}</div></SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
          </div>
        </form>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">{t('dashboard.common.cancel')}</Button></DialogClose>
            <Button type="submit" disabled={isSaving} form={`feature-dialog-form-${feature?.id || 'new'}`}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('dashboard.common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StoreFeaturesPage() {
  const { t } = useLanguage();
  const firestore = useFirestore();
  const { toast } = useToast();
  const featuresQuery = useMemoFirebase(() => query(collection(firestore, 'storeFeatures')), [firestore]);
  const { data: features, isLoading: areFeaturesLoading, refetch } = useCollection<StoreFeature>(featuresQuery);
  const [featureToDelete, setFeatureToDelete] = React.useState<StoreFeature | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();
  
  React.useEffect(() => {
      if (!isRoleLoading && !isAdmin) {
          router.replace('/dashboard');
      }
  }, [isAdmin, isRoleLoading, router]);

  const handleDeleteFeature = async () => {
    if (!featureToDelete || !firestore) return;
    
    setIsDeleting(true);
    const featureDocRef = doc(firestore, 'storeFeatures', featureToDelete.id);
    
    try {
      await deleteDoc(featureDocRef);
      refetch();
      toast({ title: "Fonctionnalité supprimée" });
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: featureDocRef.path, operation: 'delete' }));
    } finally {
      setIsDeleting(false);
      setFeatureToDelete(null);
      setIsAlertOpen(false);
    }
  };
  
  const openDeleteDialog = (feature: StoreFeature) => {
    setFeatureToDelete(feature);
    setIsAlertOpen(true);
  }
  
  const isLoading = areFeaturesLoading || isRoleLoading;

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
            <CardTitle>Gérer les fonctionnalités du magasin</CardTitle>
            <CardDescription>Ajoutez, modifiez ou supprimez les fonctionnalités affichées sur la page "Nos atouts".</CardDescription>
            </div>
            <FeatureDialog onActionComplete={refetch}>
                <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Ajouter une fonctionnalité
                </Button>
            </FeatureDialog>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Icône</TableHead>
                <TableHead>Titre (FR)</TableHead>
                <TableHead>Description (FR)</TableHead>
                <TableHead><span className="sr-only">{t('dashboard.common.actions')}</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {areFeaturesLoading && Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
                ))}
                {features?.map(feature => {
                  const Icon = iconMap[feature.icon] || Leaf;
                  return (
                  <TableRow key={feature.id}>
                      <TableCell><Icon className="h-5 w-5 text-primary" /></TableCell>
                      <TableCell className="font-medium">{feature.title_fr}</TableCell>
                      <TableCell className="text-muted-foreground line-clamp-1">{feature.description_fr}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <FeatureDialog feature={feature} onActionComplete={refetch}><DropdownMenuItem onSelect={(e) => e.preventDefault()}><Edit className="mr-2 h-4 w-4" />{t('dashboard.common.edit')}</DropdownMenuItem></FeatureDialog>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(feature);}} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />{t('dashboard.common.delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                  </TableRow>
                  );
                })}
            </TableBody>
            </Table>
            {!areFeaturesLoading && features?.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">Aucune fonctionnalité trouvée.</div>
            )}
        </CardContent>
        </Card>
        
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>{t('dashboard.common.confirmDeleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>Cette action est irréversible. Voulez-vous vraiment supprimer la fonctionnalité "{featureToDelete?.title_fr}"?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setFeatureToDelete(null)}>{t('dashboard.common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteFeature} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{t('dashboard.common.delete')}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
    