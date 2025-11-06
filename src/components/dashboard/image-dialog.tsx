
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useState } from 'react';

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
import { Loader2 } from 'lucide-react';

const imageFormSchema = z.object({
    url: z.string().url({ message: "Veuillez entrer une URL d'image valide."}),
});

interface ImageDialogProps {
    onImageAdd: (url: string) => void;
    children: React.ReactNode;
}

export function ImageDialog({ onImageAdd, children }: ImageDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const form = useForm<z.infer<typeof imageFormSchema>>({
        resolver: zodResolver(imageFormSchema),
        defaultValues: { url: '' },
    });
    
    useEffect(() => {
        if(isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    function onSubmit(values: z.infer<typeof imageFormSchema>) {
        onImageAdd(values.url);
        toast({ title: 'Image ajoutée' });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter une nouvelle image</DialogTitle>
                    <DialogDescription>Collez l'URL de l'image que vous souhaitez ajouter.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="image-dialog-form">
                        <FormField control={form.control} name="url" render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL de l'image</FormLabel>
                                <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </form>
                </Form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Annuler</Button>
                    </DialogClose>
                    <Button type="submit" form="image-dialog-form">
                        Ajouter l'image
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
