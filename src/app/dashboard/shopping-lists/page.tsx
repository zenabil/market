'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { ShoppingList } from '@/lib/placeholder-data';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const listFormSchema = z.object({
  name: z.string().min(2, { message: 'Le nom est requis.' }),
});


function ListDialog({ list, onActionComplete, children }: { list?: ShoppingList, onActionComplete: () => void, children: React.ReactNode }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const isEditing = !!list;

    const form = useForm<z.infer<typeof listFormSchema>>({
        resolver: zodResolver(listFormSchema),
        defaultValues: { name: '' },
    });
    
    React.useEffect(() => {
        if (isOpen) {
            form.reset({ name: isEditing ? list.name : '' });
        }
    }, [isOpen, list, isEditing, form]);


    async function onSubmit(values: z.infer<typeof listFormSchema>) {
        if (!firestore || !user) return;
        setIsSaving(true);
        
        if (isEditing) {
            const listRef = doc(firestore, `users/${user.uid}/shopping-lists`, list.id);
            updateDoc(listRef, { name: values.name })
                .then(() => {
                    toast({ title: 'Liste renommée' });
                    onActionComplete();
                })
                .catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: listRef.path,
                        operation: 'update',
                        requestResourceData: { name: values.name },
                    }));
                })
                .finally(() => {
                    setIsOpen(false);
                    setIsSaving(false);
                });
        } else {
             const listData = {
                name: values.name,
                userId: user.uid,
                createdAt: new Date().toISOString(),
                items: [],
            };
            const listsCollection = collection(firestore, `users/${user.uid}/shopping-lists`);
            addDoc(listsCollection, listData)
                .then(() => {
                    toast({ title: 'Liste créée' });
                    onActionComplete();
                })
                .catch(error => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: listsCollection.path,
                        operation: 'create',
                        requestResourceData: listData,
                    }));
                })
                .finally(() => {
                    setIsOpen(false);
                    setIsSaving(false);
                });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Renommer la liste' : 'Créer une nouvelle liste de courses'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id={`list-dialog-form-${list?.id || 'new'}`}>
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de la liste</Label>
                        <Input id="name" {...form.register('name')} placeholder={isEditing ? '' : "Ex: Courses de la semaine"} />
                        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSaving} form={`list-dialog-form-${list?.id || 'new'}`}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Enregistrer' : 'Créer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function ShoppingListsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [listToDelete, setListToDelete] = React.useState<ShoppingList | null>(null);
    const [isAlertOpen, setIsAlertOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const shoppingListsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, `users/${user.uid}/shopping-lists`), orderBy('createdAt', 'desc'));
    }, [user, firestore]);

    const { data: shoppingLists, isLoading: areListsLoading, refetch } = useCollection<ShoppingList>(shoppingListsQuery);

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleDeleteList = async () => {
        if (!listToDelete || !firestore || !user) return;

        setIsDeleting(true);
        const listDocRef = doc(firestore, `users/${user.uid}/shopping-lists`, listToDelete.id);

        deleteDoc(listDocRef)
            .then(() => {
                toast({ title: 'Liste supprimée' });
                refetch();
            })
            .catch(error => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: listDocRef.path,
                    operation: 'delete',
                }));
            })
            .finally(() => {
                setIsDeleting(false);
                setListToDelete(null);
                setIsAlertOpen(false);
            });
    };

    const openDeleteDialog = (list: ShoppingList) => {
        setListToDelete(list);
        setIsAlertOpen(true);
    }

    const isLoading = isUserLoading || areListsLoading;

    if (isLoading && !shoppingLists) {
        return (
            <div className="container py-8 md:py-12">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            </div>
        );
    }
    
    return (
        <div className="container py-8 md:py-12">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className='font-headline text-3xl'>Mes listes de courses</h1>
                    <p className="text-muted-foreground mt-1">Gérez vos listes de courses pour vous organiser.</p>
                </div>
                <ListDialog onActionComplete={refetch}>
                     <Button size="sm" className="gap-1">
                        <PlusCircle className="h-4 w-4" />
                        Créer une liste
                    </Button>
                </ListDialog>
            </div>

            {shoppingLists && shoppingLists.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shoppingLists.map(list => (
                        <Card key={list.id} className="flex flex-col">
                            <CardHeader className="flex-row items-start justify-between">
                                <div>
                                    <CardTitle className="hover:text-primary transition-colors">
                                        <Link href={`/dashboard/shopping-lists/${list.id}`}>{list.name}</Link>
                                    </CardTitle>
                                    <CardDescription>Créée le {formatDate(list.createdAt)}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/dashboard/shopping-lists/${list.id}`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Ouvrir
                                            </Link>
                                        </DropdownMenuItem>
                                        <ListDialog list={list} onActionComplete={refetch}>
                                            <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                                <Edit className="mr-2 h-4 w-4" />
                                                Renommer
                                            </button>
                                        </ListDialog>
                                        <DropdownMenuItem onSelect={() => openDeleteDialog(list)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground italic">
                                    {list.items.length > 0 ? `${list.items.length} article(s)` : "Cette liste est vide."}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center p-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">Aucune liste de courses trouvée</h3>
                    <p className="text-muted-foreground mt-2">Commencez par créer votre première liste !</p>
                </div>
            )}

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action ne peut pas être annulée. Cela supprimera définitivement la liste "{listToDelete?.name || ''}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setListToDelete(null)}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteList} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
