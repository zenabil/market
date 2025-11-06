
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect, useState } from 'react';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, arrayUnion, arrayRemove, updateDoc, DocumentReference } from 'firebase/firestore';
import type { User as FirestoreUser, Address } from '@/lib/placeholder-data';
import { Loader2 } from 'lucide-react';

const addressFormSchema = z.object({
    street: z.string().min(5, { message: "La rue doit comporter au moins 5 caractères."}),
    city: z.string().min(2, { message: "La ville doit comporter au moins 2 caractères."}),
    zipCode: z.string().min(3, { message: "Le code postal doit comporter au moins 3 caractères."}),
    country: z.string().min(2, { message: "Le pays doit comporter au moins 2 caractères."}),
});

interface AddressDialogProps {
    userDocRef: DocumentReference | null;
    firestoreUser: FirestoreUser | null;
    addressToEdit?: Address | null;
    children: React.ReactNode;
}

export function AddressDialog({ userDocRef, firestoreUser, addressToEdit, children }: AddressDialogProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const addressForm = useForm<z.infer<typeof addressFormSchema>>({
        resolver: zodResolver(addressFormSchema),
        defaultValues: { street: '', city: 'Tlemcen', zipCode: '', country: 'Algeria' },
    });

    useEffect(() => {
        if (isOpen) {
            if (addressToEdit) {
                addressForm.reset(addressToEdit);
            } else {
                addressForm.reset({ street: '', city: 'Tlemcen', zipCode: '', country: 'Algeria' });
            }
        }
    }, [addressToEdit, isOpen, addressForm]);

    async function onAddressSubmit(values: z.infer<typeof addressFormSchema>) {
        if (!userDocRef) return;
        setIsSubmitting(true);

        if (addressToEdit) {
            const currentAddresses = firestoreUser?.addresses || [];
            const updatedAddresses = currentAddresses.map(addr =>
                addr.id === addressToEdit.id ? { ...addr, ...values, id: addr.id } : addr
            );
            
            updateDoc(userDocRef, { addresses: updatedAddresses })
                .then(() => {
                    toast({ title: 'Adresse mise à jour' });
                    setIsOpen(false);
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
                    setIsSubmitting(false);
                });
        } else {
            const newAddress: Address = { id: `addr_${Date.now()}`, ...values };
            updateDoc(userDocRef, { addresses: arrayUnion(newAddress) })
                .then(() => {
                    toast({ title: 'Adresse ajoutée' });
                    setIsOpen(false);
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
                    setIsSubmitting(false);
                });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{addressToEdit ? 'Modifier l\'adresse' : 'Ajouter une nouvelle adresse'}</DialogTitle>
                    <DialogDescription>{addressToEdit ? 'Modifiez les détails de votre adresse ci-dessous.' : 'Ajoutez une nouvelle adresse de livraison à votre profil.'}</DialogDescription>
                </DialogHeader>
                <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4" id="address-dialog-form">
                        <FormField control={addressForm.control} name="street" render={({ field }) => (
                            <FormItem><FormLabel>Rue</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={addressForm.control} name="city" render={({ field }) => (
                                <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={addressForm.control} name="zipCode" render={({ field }) => (
                                <FormItem><FormLabel>Code postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={addressForm.control} name="country" render={({ field }) => (
                                <FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                    </form>
                </Form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button type="submit" form="address-dialog-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enregistrer les modifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
