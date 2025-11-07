'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useRef } from 'react';
import { updatePassword, updateProfile } from 'firebase/auth';

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
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  email: z.string().email(),
  phone: z.string().optional(),
});

const passwordFormSchema = z.object({
    newPassword: z.string().min(6, { message: 'Le mot de passe doit comporter au moins 6 caractères.' }),
    confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ["confirmPassword"],
});

export default function ProfilePage() {
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

  const { data: firestoreUser, isLoading: isFirestoreUserLoading, refetch } = useDoc<FirestoreUser>(userDocRef);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

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


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userDocRef || !authUser) return;
  
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        await updateProfile(authUser, { photoURL: dataUrl });
        const updateData = { avatar: dataUrl };
        updateDoc(userDocRef, updateData).catch((error) => {
           if ((error as any).code?.includes('permission-denied')) {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'update',
                    requestResourceData: { avatar: '...data URI...' },
                }));
            }
        });
        toast({ title: 'Avatar mis à jour' });
        refetch();
      } catch (error) {
        console.error("Avatar update failed:", error);
        toast({ variant: 'destructive', title: 'Erreur', description: "Impossible de mettre à jour l'avatar." });
      }
    };
    reader.readAsDataURL(file);
  };


  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>>) {
    if (!userDocRef || !authUser) return;
    setIsSaving(true);
    
    try {
        if (values.name !== authUser.displayName) {
            await updateProfile(authUser, { displayName: values.name });
        }

        const updateData = { name: values.name, phone: values.phone };
        await updateDoc(userDocRef, updateData);
        refetch();
        toast({
            title: 'Profil mis à jour',
            description: 'Vos informations ont été enregistrées.',
        });

    } catch (error: any) {
        if (error.code === 'permission-denied' || (error.name === 'FirebaseError' && error.message.includes('permission'))) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
                requestResourceData: { name: values.name, phone: values.phone },
            }));
        } else {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Échec de la mise à jour",
                description: "Nous n'avons pas pu enregistrer vos modifications."
            });
        }
    } finally {
        setIsSaving(false);
    }
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>>) {
      if (!authUser) return;
      setIsPasswordSaving(true);
      try {
          await updatePassword(authUser, values.newPassword);
          toast({
              title: 'Mot de passe mis à jour',
              description: 'Votre mot de passe a été modifié avec succès.',
          });
          passwordForm.reset({ newPassword: '', confirmPassword: '' });
      } catch (error: any) {
          toast({
              variant: "destructive",
              title: "Erreur",
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
      toast({ title: 'Adresse supprimée' });
      refetch();
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
          <CardTitle>Mon Profil</CardTitle>
          <CardDescription>Gérez les informations de votre profil.</CardDescription>
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
                                <AvatarImage src={authUser?.photoURL || firestoreUser?.avatar || `https://picsum.photos/seed/${authUser?.uid}/100/100`} />
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
                                <span className="text-sm text-muted-foreground">Points de fidélité</span>
                            </div>
                        </div>
                    </div>
                    <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nom</FormLabel>
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
                            <FormLabel>Email</FormLabel>
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
                            <FormLabel>Téléphone</FormLabel>
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
                            Enregistrer les modifications
                        </Button>
                    </div>
                    </form>
                </Form>
            )}
        </CardContent>
      </Card>

    <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>Mettez à jour votre mot de passe pour des raisons de sécurité.</CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                     <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nouveau mot de passe</FormLabel>
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
                            <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
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
                            Mettre à jour le mot de passe
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>

    <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Gérer les adresses</CardTitle>
            <CardDescription>Ajoutez ou supprimez vos adresses de livraison.</CardDescription>
          </div>
          <AddressDialog userDocRef={userDocRef} firestoreUser={firestoreUser}>
            <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter une adresse
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
                                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                        <AlertDialogDescription>Voulez-vous vraiment supprimer cette adresse ?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteAddress(addr)}>Supprimer</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">Aucune adresse enregistrée.</p>
            )}
           </div>
        </CardContent>
    </Card>
    </div>
  );
}

    