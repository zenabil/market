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
import { useUser, useFirestore, useDoc, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { User as FirestoreUser, Address } from '@/lib/placeholder-data';
import { Loader2, Pencil, Trash2, Gem } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';


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
  const [isAddressSaving, setIsAddressSaving] = React.useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

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
    if (addressToEdit) {
      addressForm.reset(addressToEdit);
    } else {
      addressForm.reset({ street: '', city: 'Tlemcen', zipCode: '', country: 'Algeria' });
    }
  }, [addressToEdit, addressForm]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && userDocRef) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // In a real app, upload this to Firebase Storage and get a URL.
        // For now, we'll just update Firestore with the data URL (not recommended for production).
        updateDocumentNonBlocking(userDocRef, { avatar: dataUrl });
        toast({ title: t('dashboard.profile.avatar_updated_title') });
      };
      reader.readAsDataURL(file);
    }
  };


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userDocRef) return;

    setIsSaving(true);
    try {
      await updateDocumentNonBlocking(userDocRef, { name: values.name, phone: values.phone });
      // Note: Email updates require re-authentication and are more complex.
      // We are only allowing name and phone updates here.
      toast({
        title: t('dashboard.profile.update_success_title'),
        description: t('dashboard.profile.update_success_desc'),
      });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: t('dashboard.generation_failed_title'),
        description: "Could not update your profile. Please try again.",
      });
    } finally {
        setIsSaving(false);
    }
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
    if (!userDocRef) return;
    setIsAddressSaving(true);
  
    try {
      if (addressToEdit) {
        // Handle update
        const currentAddresses = firestoreUser?.addresses || [];
        const updatedAddresses = currentAddresses.map(addr =>
          addr.id === addressToEdit.id ? { ...addr, ...values } : addr
        );
        
        await updateDocumentNonBlocking(userDocRef, { addresses: updatedAddresses });
        toast({ title: t('dashboard.profile.address_updated_title') });
        setAddressToEdit(null); // Close the dialog
  
      } else {
        // Handle add new
        const newAddress: Address = {
            id: `addr_${Date.now()}`, // Simple unique ID
            ...values
        };
        await updateDocumentNonBlocking(userDocRef, {
            addresses: arrayUnion(newAddress)
        });
        toast({ title: t('dashboard.profile.address_added_title') });
        addressForm.reset({ street: '', city: 'Tlemcen', zipCode: '', country: 'Algeria' });
      }
    } catch (error) {
        const action = addressToEdit ? 'update' : 'add';
        toast({ variant: 'destructive', title: "Error", description: `Could not ${action} address.` });
        console.error(`Error ${action}ing address:`, error);
    } finally {
      setIsAddressSaving(false);
    }
  }

  async function deleteAddress(address: Address) {
        if (!userDocRef) return;
        try {
            // To delete an item from an array, we need to provide the exact object to remove.
            // We need to find the full address object from the user's data to ensure it matches.
            const addressToDelete = firestoreUser?.addresses?.find(a => a.id === address.id);
            if (!addressToDelete) {
                throw new Error("Address not found in user's profile.");
            }
            await updateDocumentNonBlocking(userDocRef, {
                addresses: arrayRemove(addressToDelete)
            });
            toast({ title: t('dashboard.profile.address_removed_title') });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not remove address." });
        }
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
        <CardHeader>
          <CardTitle>{t('dashboard.profile.manage_addresses_title')}</CardTitle>
          <CardDescription>{t('dashboard.profile.manage_addresses_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            {firestoreUser?.addresses && firestoreUser.addresses.length > 0 ? (
                firestoreUser.addresses.map(addr => (
                    <div key={addr.id} className="flex justify-between items-center p-3 border rounded-md">
                        <p className="text-sm text-muted-foreground">{addr.street}, {addr.city}, {addr.zipCode}, {addr.country}</p>
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" onClick={() => setAddressToEdit(addr)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
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
           <Separator className="my-6" />
            <h4 className="font-semibold mb-4">{t('dashboard.profile.add_new_address')}</h4>
             <Form {...addressForm}>
                <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4" id="address-form">
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
             <div className="flex justify-end mt-4">
                <Button type="submit" form="address-form" disabled={isAddressSaving || !!addressToEdit}>
                    {isAddressSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.profile.add_address_button')}
                </Button>
            </div>
        </CardContent>
    </Card>

    <Dialog open={!!addressToEdit} onOpenChange={(isOpen) => !isOpen && setAddressToEdit(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{t('dashboard.profile.edit_address_title')}</DialogTitle>
                <DialogDescription>{t('dashboard.profile.edit_address_desc')}</DialogDescription>
            </DialogHeader>
            <Form {...addressForm}>
                <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4" id="edit-address-form">
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
                <Button type="submit" form="edit-address-form" disabled={isAddressSaving}>
                    {isAddressSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.save_changes')}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  );
}
