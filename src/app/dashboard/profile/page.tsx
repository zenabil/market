
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useRef } from 'react';
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
import { doc, arrayRemove, updateDoc } from 'firebase/firestore';
import type { User as FirestoreUser, Address } from '@/lib/placeholder-data';
import { Loader2, Pencil, Trash2, Gem, PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AddressDialog } from '@/components/dashboard/address-dialog';


const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
  phone: z.string().optional(),
});

const getPasswordFormSchema = (t: (key: string, options?: any) => string) => z.object({
    newPassword: z.string().min(6, { message: t('auth.password_min_length') }),
    confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.passwords_dont_match'),
    path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = React.useState(false);
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
  
  const passwordFormSchema = getPasswordFormSchema(t);

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
      resolver: zodResolver(passwordFormSchema),
      defaultValues: { newPassword: '', confirmPassword: '' },
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
  
  function deleteAddress(addressToDelete: Address) {
    if (!userDocRef) return;
  
    const addressObject = firestoreUser?.addresses?.find(addr => addr.id === addressToDelete.id);
    if (!addressObject) return;
    
    const updateData = {
        addresses: arrayRemove(addressObject)
    };

    updateDoc(userDocRef, updateData)
    .then(() => {
      toast({ title: t('dashboard.profile.address_removed_title') });
    })
    .catch((error) => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: { addresses: `arrayRemove operation for address id: ${addressToDelete.id}` }
        })
      );
    });
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
          <AddressDialog userDocRef={userDocRef} firestoreUser={firestoreUser}>
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('dashboard.profile.add_address_button')}
            </Button>
          </AddressDialog>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
            {firestoreUser?.addresses && firestoreUser.addresses.length > 0 ? (
                firestoreUser.addresses.map(addr => (
                    <div key={addr.id} className="flex justify-between items-center p-3 border rounded-md">
                        <p className="text-sm text-muted-foreground">{addr.street}, {addr.city}, {addr.zipCode}, {addr.country}</p>
                        <div className="flex items-center">
                            <AddressDialog userDocRef={userDocRef} firestoreUser={firestoreUser} addressToEdit={addr}>
                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                            </AddressDialog>
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
    </div>
  );
}
