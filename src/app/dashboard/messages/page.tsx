
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/language-provider';


type ContactMessage = {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: string;
};

function MessageViewDialog({ message }: { message: ContactMessage | null }) {
    const { t } = useLanguage();
    if (!message) return null;

    return (
        <DialogContent className="sm:max-w-xl">
            <DialogHeader>
                <DialogTitle>{message.subject}</DialogTitle>
                <DialogDescription>
                    De : {message.name} &lt;{message.email}&gt; le {new Date(message.createdAt).toLocaleString(t('locale'))}
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] my-4">
                <p className="text-sm whitespace-pre-wrap p-1">{message.message}</p>
            </ScrollArea>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">{t('dashboard.common.cancel')}</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}


export default function MessagesPage() {
    const { t } = useLanguage();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { isAdmin, isRoleLoading } = useUserRole();
    const router = useRouter();

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'contactMessages'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: messages, isLoading: areMessagesLoading, refetch } = useCollection<ContactMessage>(messagesQuery);

    React.useEffect(() => {
        if (!isRoleLoading && !isAdmin) {
            router.replace('/dashboard');
        }
    }, [isAdmin, isRoleLoading, router]);
    
    const handleDeleteMessage = async () => {
        if (!messageToDelete || !firestore) return;
        
        setIsDeleting(true);
        const messageRef = doc(firestore, 'contactMessages', messageToDelete.id);

        try {
            await deleteDoc(messageRef);
            toast({ title: t('dashboard.messages.toast.deleted') });
            refetch();
        } catch(error) {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: messageRef.path,
                    operation: 'delete',
                })
            );
        } finally {
            setIsDeleting(false);
            setMessageToDelete(null);
        }
    };
    
    const isLoading = isRoleLoading || areMessagesLoading;
    
    if (isLoading || !isAdmin) {
        return (
            <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
  
  return (
    <div className="container py-8 md:py-12">
        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedMessage(null)}>
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline text-3xl'>{t('dashboard.layout.messages')}</CardTitle>
                    <CardDescription>{t('dashboard.messages.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('dashboard.messages.date')}</TableHead>
                                <TableHead>{t('dashboard.messages.from')}</TableHead>
                                <TableHead>{t('dashboard.messages.subject')}</TableHead>
                                <TableHead className="text-right">{t('dashboard.common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areMessagesLoading && Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {messages?.map(message => (
                                <TableRow key={message.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedMessage(message)}>
                                    <TableCell>{new Date(message.createdAt).toLocaleString(t('locale'))}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{message.name}</div>
                                        <div className="text-sm text-muted-foreground">{message.email}</div>
                                    </TableCell>
                                    <TableCell>{message.subject}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog onOpenChange={(isOpen) => !isOpen && messageToDelete && setMessageToDelete(null)}>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent dialog from opening
                                                        setMessageToDelete(message);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t('dashboard.common.confirmDeleteTitle')}</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('dashboard.messages.confirmDeleteDescription')}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>{t('dashboard.common.cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteMessage()} disabled={isDeleting}>
                                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('dashboard.common.delete')}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {!areMessagesLoading && messages?.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            {t('dashboard.messages.noMessages')}
                        </div>
                    )}
                </CardContent>
            </Card>
            <MessageViewDialog message={selectedMessage} />
        </Dialog>
    </div>
  );
}
