'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, addDoc, deleteDoc, collection } from 'firebase/firestore';
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


function NewCouponDialog({ onCouponCreated }: { onCouponCreated: () => void }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const couponFormSchema = z.object({
    code: z.string().min(4, { message: 'Code must be at least 4 characters.' }).max(20),
    discountPercentage: z.coerce.number().min(1).max(100),
    expiryDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date" }),
  });

  const form = useForm<z.infer<typeof couponFormSchema>>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: '',
      discountPercentage: 10,
    },
  });

  async function onSubmit(values: z.infer<typeof couponFormSchema>) {
    if (!firestore) return;

    setIsSaving(true);
    const couponData = {
        ...values,
        isActive: new Date(values.expiryDate) > new Date(),
        expiryDate: new Date(values.expiryDate).toISOString()
    };
    
    const couponsCollection = collection(firestore, 'coupons');
    addDoc(couponsCollection, couponData)
      .then(() => {
          toast({ title: t('dashboard.coupons.created_title') });
          form.reset();
          setIsOpen(false);
          onCouponCreated();
      })
      .catch(error => {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: couponsCollection.path,
              operation: 'create',
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
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          {t('dashboard.coupons.add_coupon')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dashboard.coupons.add_coupon')}</DialogTitle>
          <DialogDescription>{t('dashboard.coupons.add_coupon_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="coupon-dialog-form">
          <div className="space-y-2">
            <Label htmlFor="code">{t('dashboard.coupons.code')}</Label>
            <Input id="code" {...form.register('code')} />
            {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="discountPercentage">{t('dashboard.coupons.discount')}</Label>
            <Input id="discountPercentage" type="number" {...form.register('discountPercentage')} />
            {form.formState.errors.discountPercentage && <p className="text-sm text-destructive">{form.formState.errors.discountPercentage.message}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="expiryDate">{t('dashboard.coupons.expiry_date')}</Label>
            <Input id="expiryDate" type="date" {...form.register('expiryDate')} />
            {form.formState.errors.expiryDate && <p className="text-sm text-destructive">{form.formState.errors.expiryDate.message}</p>}
          </div>
        </form>
         <DialogFooter>
           <DialogClose asChild>
            <Button type="button" variant="outline">{t('dashboard.cancel')}</Button>
           </DialogClose>
          <Button type="submit" disabled={isSaving} form="coupon-dialog-form">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dashboard.coupons.save_coupon')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function CouponsPage() {
  const { t, locale } = useLanguage();
  const firestore = useFirestore();
  const { coupons, isLoading, refetchCoupons } = useCoupons();
  const [couponToDelete, setCouponToDelete] = React.useState<Coupon | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDeleteCoupon = () => {
    if (couponToDelete && firestore) {
      const couponDocRef = doc(firestore, 'coupons', couponToDelete.id);
      deleteDoc(couponDocRef)
        .then(() => {
          refetchCoupons();
        })
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: couponDocRef.path,
                    operation: 'delete',
                })
            );
        });
      setCouponToDelete(null);
    }
    setIsAlertOpen(false);
  };
  
  const openDeleteDialog = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setIsAlertOpen(true);
  }

  return (
    <div className="container py-8 md:py-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.nav.coupons')}</CardTitle>
              <CardDescription>{t('dashboard.coupons.description')}</CardDescription>
            </div>
            <NewCouponDialog onCouponCreated={refetchCoupons} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.coupons.code')}</TableHead>
                  <TableHead>{t('dashboard.coupons.discount')}</TableHead>
                  <TableHead>{t('dashboard.coupons.expiry_date')}</TableHead>
                  <TableHead>{t('dashboard.coupons.status')}</TableHead>
                  <TableHead><span className="sr-only">{t('dashboard.actions')}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {coupons && coupons.map(coupon => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono">{coupon.code}</TableCell>
                    <TableCell>{coupon.discountPercentage}%</TableCell>
                    <TableCell>{formatDate(coupon.expiryDate)}</TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? 'default' : 'destructive'}>
                        {coupon.isActive ? t('dashboard.coupons.active') : t('dashboard.coupons.expired')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('dashboard.toggle_menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             <DropdownMenuItem onSelect={(e) => { e.preventDefault(); openDeleteDialog(coupon);}} className="text-destructive">
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
            {!isLoading && coupons?.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                {t('dashboard.coupons.no_coupons')}
              </div>
            )}
          </CardContent>
        </Card>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{t('dashboard.coupons.delete_confirmation_title')}</AlertDialogTitle>
                <AlertDialogDescription>
                {t('dashboard.coupons.delete_confirmation_desc', { couponCode: couponToDelete?.code || '' })}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCouponToDelete(null)}>{t('dashboard.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCoupon}>{t('dashboard.delete')}</AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
