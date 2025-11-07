'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Loader2, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, addDoc, deleteDoc, collection, updateDoc } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCoupons } from '@/hooks/use-coupons';
import type { Coupon } from '@/lib/placeholder-data';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';


const couponFormSchema = z.object({
    code: z.string().min(4, { message: 'Le code doit comporter au moins 4 caractères.' }).max(20),
    discountPercentage: z.coerce.number().min(1).max(100),
    expiryDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Date invalide' }),
    isActive: z.boolean().default(true),
});

function CouponDialog({ coupon, onActionComplete }: { coupon?: Coupon | null, onActionComplete: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const isEditing = !!coupon;

  const form = useForm<z.infer<typeof couponFormSchema>>({
    resolver: zodResolver(couponFormSchema),
  });
  
  React.useEffect(() => {
    if (isOpen) {
      if (coupon) {
        form.reset({
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
            expiryDate: coupon.expiryDate.split('T')[0], // Format for date input
            isActive: coupon.isActive,
        });
      } else {
        form.reset({
            code: '',
            discountPercentage: 10,
            expiryDate: '',
            isActive: true,
        });
      }
    }
  }, [isOpen, coupon, form]);

  async function onSubmit(values: z.infer<typeof couponFormSchema>) {
    if (!firestore) return;

    setIsSaving(true);
    const expiryDate = new Date(values.expiryDate);
    const couponData = {
        code: values.code,
        discountPercentage: values.discountPercentage,
        expiryDate: expiryDate.toISOString(),
        isActive: values.isActive,
    };
    
    const actionPromise = isEditing
        ? updateDoc(doc(firestore, 'coupons', coupon.id), couponData)
        : addDoc(collection(firestore, 'coupons'), couponData);

    actionPromise
      .then(() => {
          toast({ title: isEditing ? 'Coupon mis à jour' : 'Coupon créé' });
          form.reset();
          setIsOpen(false);
          onActionComplete();
      })
      .catch(error => {
          const path = isEditing ? `coupons/${coupon.id}` : 'coupons';
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: path,
              operation: isEditing ? 'update' : 'create',
              requestResourceData: couponData,
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
        {isEditing ? (
            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
            </DropdownMenuItem>
        ) : (
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-4 w-4" />
              Ajouter un coupon
            </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le coupon' : 'Ajouter un nouveau coupon'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les détails du coupon ci-dessous.' : 'Créez un nouveau code de réduction pour vos clients.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="coupon-dialog-form">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" {...form.register('code')} />
            {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="discountPercentage">Pourcentage de réduction</Label>
            <Input id="discountPercentage" type="number" {...form.register('discountPercentage')} />
            {form.formState.errors.discountPercentage && <p className="text-sm text-destructive">{form.formState.errors.discountPercentage.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="expiryDate">Date d'expiration</Label>
            <Input id="expiryDate" type="date" {...form.register('expiryDate')} />
            {form.formState.errors.expiryDate && <p className="text-sm text-destructive">{form.formState.errors.expiryDate.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="isActive" {...form.register('isActive')} checked={form.watch('isActive')} onCheckedChange={(checked) => form.setValue('isActive', checked)} />
            <Label htmlFor="isActive">Actif</Label>
          </div>
        </form>
         <DialogFooter>
           <DialogClose asChild>
            <Button type="button" variant="outline">Annuler</Button>
           </DialogClose>
          <Button type="submit" disabled={isSaving} form="coupon-dialog-form">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function CouponsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { coupons, isLoading: areCouponsLoading, refetchCoupons } = useCoupons();
  const [couponToDelete, setCouponToDelete] = React.useState<Coupon | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  React.useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
        router.replace('/dashboard');
    }
  }, [isAdmin, isRoleLoading, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const getStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { text: 'Inactif', variant: 'destructive' as const };
    if (new Date(coupon.expiryDate) < new Date()) return { text: 'Expiré', variant: 'destructive' as const };
    return { text: 'Actif', variant: 'default' as const };
  }

  const handleDeleteCoupon = async () => {
    if (!couponToDelete || !firestore) return;

    setIsDeleting(true);
    const couponDocRef = doc(firestore, 'coupons', couponToDelete.id);

    try {
        await deleteDoc(couponDocRef);
        refetchCoupons();
        toast({ title: 'Coupon supprimé' });
    } catch (error) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: couponDocRef.path,
                operation: 'delete',
            })
        );
        toast({
            variant: 'destructive',
            title: 'Erreur de suppression',
            description: 'Vous n\'avez peut-être pas la permission de faire cela.',
        });
    } finally {
        setIsDeleting(false);
        setCouponToDelete(null);
        setIsAlertOpen(false);
    }
  };
  
  const openDeleteDialog = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsAlertOpen(true);
  }
  
  const isLoading = areCouponsLoading || isRoleLoading;

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
              <CardTitle>Coupons</CardTitle>
              <CardDescription>Gérez vos codes de réduction.</CardDescription>
            </div>
            <CouponDialog onActionComplete={refetchCoupons} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Date d'expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areCouponsLoading && Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {coupons && coupons.map(coupon => {
                  const status = getStatus(coupon);
                  return (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono">{coupon.code}</TableCell>
                    <TableCell>{coupon.discountPercentage}%</TableCell>
                    <TableCell>{formatDate(coupon.expiryDate)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ouvrir le menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <CouponDialog coupon={coupon} onActionComplete={refetchCoupons} />
                             <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(coupon);}} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
            {!areCouponsLoading && coupons?.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                Aucun coupon trouvé.
              </div>
            )}
          </CardContent>
        </Card>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ?</AlertDialogTitle>
                <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera définitivement le coupon "{couponToDelete?.code || ''}".
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCouponToDelete(null)}>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCoupon} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Supprimer
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
