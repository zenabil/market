'use client';

import React, { useEffect } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { ShoppingList } from '@/lib/placeholder-data';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const listContentSchema = z.object({
  items: z.string(),
});

function ShoppingListDetail() {
    const { id: listId } = useParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = React.useState(false);

    const listDocRef = useMemoFirebase(() => {
        if (!user || !firestore || !listId) return null;
        return doc(firestore, `users/${user.uid}/shopping-lists`, listId as string);
    }, [user, firestore, listId]);

    const { data: shoppingList, isLoading: isListLoading } = useDoc<ShoppingList>(listDocRef);

    const form = useForm<z.infer<typeof listContentSchema>>({
        resolver: zodResolver(listContentSchema),
        defaultValues: { items: '' },
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        if (shoppingList) {
            form.reset({
                items: shoppingList.items.join('\n'),
            });
        }
    }, [shoppingList, form]);

    async function onSubmit(values: z.infer<typeof listContentSchema>) {
        if (!listDocRef) return;
        setIsSaving(true);
        
        const itemsArray = values.items.split('\n').map(item => item.trim()).filter(Boolean);
        const updateData = { items: itemsArray };
        
        updateDoc(listDocRef, updateData)
            .then(() => {
                toast({ title: 'Liste enregistrée' });
            })
            .catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: listDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
            })
            .finally(() => {
                setIsSaving(false);
            });
    }

    const isLoading = isUserLoading || isListLoading;

    if (isLoading) {
        return (
            <div className="container py-8 md:py-12">
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-96 w-full" />
                <div className="flex justify-end mt-4">
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        );
    }
    
    if (!shoppingList) {
        return notFound();
    }

    return (
        <div className="container py-8 md:py-12">
             <div className="flex items-center gap-4 mb-8">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/shopping-lists">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl">{shoppingList.name}</h1>
                </div>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                     <FormField
                        control={form.control}
                        name="items"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Articles de la liste</FormLabel>
                                <FormControl>
                                    <Textarea
                                        rows={15}
                                        placeholder="Écrivez chaque article sur une nouvelle ligne..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer les modifications
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

export default function ShoppingListDetailPage() {
    return <ShoppingListDetail />;
}
