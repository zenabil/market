
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useRef, useState } from 'react';
import { updatePassword } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, arrayUnion, arrayRemove, updateDoc, getDoc } from 'firebase/firestore';
import type { User as FirestoreUser, Address } from '@/lib/placeholder-data';
import { Loader2, Pencil, Trash2, Gem, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';


const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
  phone: z.string().optional(),
});

const passwordFormSchema = z.object({
    newPassword: z.string().min(6, { message: "Password must be at least 6 characters."}),
    confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const addressFormSchema = z.object({
    street: z.string().min(5, { message: "Street must be at least 5 characters."}),
    city: z.string().min(2, { message: "City must be at least 2 characters."}),
    zipCode: z.string().min(3, { message: "Zip code must be at least 3 characters."}),
    country: z.string().min(2, { message: "Country must be at least 2 characters."}),
});


export default function ProfilePage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = React.useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = React.useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: firestoreUser, isLoading: isFirestoreUserLoading } = useDoc<FirestoreUser>(userDocRef);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
      resolver: zodResolver(passwordFormSchema),
      defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const addressForm = useForm<z.infer<typeof addressFormSchema>>({
      resolver: zodResolver(addressFormSchema),
      defaultValues: { street: '', city: 'Tlemcen', zipCode: '', country: 'Algeria' },
  });

  useEffect(() => {
    if (firestoreUser) {
      profileForm.reset({
        name: firestoreUser.name,
        email: firestoreUser.email,
        phone: firestoreUser.phone || '',
      });
    } else if (authUser) {
        profileForm.reset({
            name: authUser.displayName || '',
            email: authUser.email || '',
            phone: authUser.phoneNumber || '',
        });
    }
  }, [firestoreUser, authUser, profileForm]);

  useEffect(() => {
    if (isAddressDialogOpen) {
        if (addressToEdit) {
            addressForm.reset(addressToEdit);
        } else {
            addressForm.reset({ street: '', city: 'Tlemcen', zipCode: '', country: 'Algeria' });
        }
    }
  }, [addressToEdit, isAddressDialogOpen, addressForm]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && userDocRef) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const updateData = { avatar: dataUrl };
        updateDoc(userDocRef, updateData)
            .then(() => {
                toast({ title: t('dashboard.profile.avatar_updated_title') });
            })
            .catch(error => {
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'update',
                        requestResourceData: { avatar: '...data URI...' },
                    })
                );
            });
      };
      reader.readAsDataURL(file);
    }
  };


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userDocRef) return;

    setIsSaving(true);
    const updateData = { name: values.name, phone: values.phone };

    updateDoc(userDocRef, updateData)
      .then(() => {
        toast({
            title: t('dashboard.profile.update_success_title'),
            description: t('dashboard.profile.update_success_desc'),
        });
      })
      .catch(error => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            })
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
      if (!authUser) return;
      setIsPasswordSaving(true);
      try {
          await updatePassword(authUser, values.newPassword);
          toast({
              title: t('dashboard.profile.password_update_success_title'),
              description: t('dashboard.profile.password_update_success_desc'),
          });
          passwordForm.reset();
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Error",
              description: error.message,
          });
      } finally {
          setIsPasswordSaving(false);
      }
  }
  
  async function onAddressSubmit(values: z.infer<typeof addressFormSchema>) {
    if (!userDocRef || !firestore) return;
    setIsSubmittingAddress(true);

    if (addressToEdit) {
      const currentAddresses = firestoreUser?.addresses || [];
      const updatedAddresses = currentAddresses.map(addr =>
        addr.id === addressToEdit.id ? { ...addr, ...values, id: addr.id } : addr
      );
      
      updateDoc(userDocRef, { addresses: updatedAddresses })
        .then(() => {
            toast({ title: t('dashboard.profile.address_updated_title') });
            setIsAddressDialogOpen(false);
        })
        .catch(() => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: { addresses: '...updated array...' }
                })
            );
        })
        .finally(() => {
            setIsSubmittingAddress(false);
        });

    } else {
      const newAddress: Address = { id: `addr_${Date.now()}`, ...values };
      updateDoc(userDocRef, { addresses: arrayUnion(newAddress) })
        .then(() => {
            toast({ title: t('dashboard.profile.address_added_title') });
            setIsAddressDialogOpen(false);
        })
        .catch(() => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: { addresses: `arrayUnion with ${newAddress.id}` }
                })
            );
        })
        .finally(() => {
            setIsSubmittingAddress(false);
        });
    }
  }

  async function deleteAddress(addressToDelete: Address) {
    if (!userDocRef) return;

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as FirestoreUser;
            const currentAddresses = userData.addresses || [];
            const updatedAddresses = currentAddresses.filter(addr => addr.id !== addressToDelete.id);
            
            await updateDoc(userDocRef, { addresses: updatedAddresses });
            toast({ title: t('dashboard.profile.address_removed_title') });
        }
    } catch (error) {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { addresses: '...filtered array...' }
            })
        );
    }
}

  const openAddressDialog = (address: Address | null) => {
    setAddressToEdit(address);
    setIsAddressDialogOpen(true);
  }


  const isLoading = isUserLoading || isFirestoreUserLoading;

  return (
    <div className="container py-8 md:py-12 space-y-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('nav.my_profile')}</CardTitle>
          <CardDescription>{t('dashboard.profile.description')}</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-8">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-24 self-end" />
                </div>
            ) : (
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="relative group">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={firestoreUser?.avatar || authUser?.photoURL || `https://picsum.photos/seed/${authUser?.uid}/100/100`} />
                                <AvatarFallback>{profileForm.getValues('name')?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <Button 
                                type="button" 
                                size="icon" 
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileChange}
                                accept="image/png, image/jpeg"
                            />
                        </div>
                        <div className='space-y-1'>
                            <h2 className="text-2xl font-bold">{profileForm.watch('name')}</h2>
                            <p className="text-muted-foreground">{profileForm.watch('email')}</p>
                            <div className="flex items-center gap-2 pt-2">
                                <Gem className="h-5 w-5 text-accent"/>
                                <span className="font-bold text-lg">{firestoreUser?.loyaltyPoints || 0}</span>
                                <span className="text-sm text-muted-foreground">{t('dashboard.loyalty.points')}</span>
                            </div>
                        </div>
                    </div>
                    <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.name')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('auth.email')}</FormLabel>
                            <FormControl>
                            <Input {...field} disabled />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('checkout.phone')}</FormLabel>
                            <FormControl>
                            <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('dashboard.save_changes')}
                        </Button>
                    </div>
                    </form>
                </Form>
            )}
        </CardContent>
      </Card>

    <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t('dashboard.profile.change_password_title')}</CardTitle>
          <CardDescription>{t('dashboard.profile.change_password_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                     <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('dashboard.profile.new_password')}</FormLabel>
                            <FormControl>
                            <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('dashboard.profile.confirm_new_password')}</FormLabel>
                            <FormControl>
                            <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <div className="flex justify-end">
                        <Button type="submit" disabled={isPasswordSaving}>
                            {isPasswordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('dashboard.profile.update_password_button')}
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>

    <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{t('dashboard.profile.manage_addresses_title')}</CardTitle>
            <CardDescription>{t('dashboard.profile.manage_addresses_desc')}</CardDescription>
          </div>
          <Button onClick={() => openAddressDialog(null)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('dashboard.profile.add_address_button')}
          </Button>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            {firestoreUser?.addresses && firestoreUser.addresses.length > 0 ? (
                firestoreUser.addresses.map(addr => (
                    <div key={addr.id} className="flex justify-between items-center p-3 border rounded-md">
                        <p className="text-sm text-muted-foreground">{addr.street}, {addr.city}, {addr.zipCode}, {addr.country}</p>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" onClick={() => openAddressDialog(addr)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </AlertDialogTrigger>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{t('dashboard.profile.delete_address_confirm_title')}</AlertDialogTitle>
                                        <AlertDialogDescription>{t('dashboard.profile.delete_address_confirm_desc')}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{t('dashboard.cancel')}</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteAddress(addr)}>{t('dashboard.delete')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">{t('dashboard.profile.no_addresses')}</p>
            )}
           </div>
        </CardContent>
    </Card>

    <Dialog open={isAddressDialogOpen} onOpenChange={(isOpen) => {
        setIsAddressDialogOpen(isOpen);
        if (!isOpen) {
            setAddressToEdit(null);
        }
    }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{addressToEdit ? t('dashboard.profile.edit_address_title') : t('dashboard.profile.add_new_address')}</DialogTitle>
                <DialogDescription>{addressToEdit ? t('dashboard.profile.edit_address_desc') : t('dashboard.profile.add_new_address_desc')}</DialogDescription>
            </DialogHeader>
            <Form {...addressForm}>
                <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4" id="address-dialog-form">
                     <FormField control={addressForm.control} name="street" render={({ field }) => (
                        <FormItem><FormLabel>{t('checkout.address')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField control={addressForm.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>{t('checkout.city')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addressForm.control} name="zipCode" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.profile.zip_code')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={addressForm.control} name="country" render={({ field }) => (
                            <FormItem><FormLabel>{t('dashboard.profile.country')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                     </div>
                </form>
            </Form>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">{t('dashboard.cancel')}</Button>
                </DialogClose>
                <Button type="submit" form="address-dialog-form" disabled={isSubmittingAddress}>
                    {isSubmittingAddress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.save_changes')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  );
}

    