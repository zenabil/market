'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React, { useEffect } from 'react';

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
import { Upload, ImageIcon, X, ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  siteName: z.string().min(2, { message: 'Le nom du site doit comporter au moins 2 caractères.' }),
  logoUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().min(10, { message: 'Le numéro de téléphone doit comporter au moins 10 chiffres.' }),
  address: z.string().min(10, { message: 'L\'adresse doit comporter au moins 10 caractères.' }),
});

type SiteSettings = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'site'), [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: '',
      phone: '',
      address: '',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
        router.replace('/dashboard/orders');
    }
  }, [isAdmin, isRoleLoading, router]);

  useEffect(() => {
    if (settings) {
      form.reset(settings);
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    }
  }, [settings, form]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload this file to Firebase Storage
      // and get a URL, then call form.setValue('logoUrl', url).
      // For this prototype, we'll just use a local data URL for preview.
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        form.setValue('logoUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true);
    setDoc(settingsRef, values, { merge: true })
        .then(() => {
            toast({
                title: 'Paramètres mis à jour',
                description: 'Les paramètres du site ont été enregistrés.',
            });
        })
        .catch(error => {
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                    path: settingsRef.path,
                    operation: 'update',
                    requestResourceData: values,
                })
            );
        })
        .finally(() => {
            setIsSaving(false);
        });
  }

  const isLoading = isLoadingSettings || isRoleLoading;
  
  if (isLoading || !isAdmin) {
      return (
        <div className="container py-8 md:py-12 flex-grow flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
  }

  return (
    <div className="container py-8 md:py-12">
        <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="icon">
            <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
            </Link>
            </Button>
            <h1 className="font-headline text-3xl md:text-4xl">Paramètres</h1>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Paramètres Généraux</CardTitle>
          <CardDescription>Gérez les paramètres globaux de votre site.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du site</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                       <div className="flex items-center gap-4">
                        {logoPreview ? (
                          <div className="relative group">
                            <Image src={logoPreview} alt="Logo preview" width={128} height={40} className="border rounded-md bg-muted aspect-[16/5] object-contain p-1" />
                             <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                    setLogoPreview(null);
                                    form.setValue('logoUrl', '');
                                    if(fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                >
                                <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                           <div 
                                className="w-32 aspect-[16/5] border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="h-8 w-8" />
                           </div>
                        )}
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                           <Upload className="mr-2 h-4 w-4" />
                            Télécharger le logo
                        </Button>
                         <Input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept="image/png, image/jpeg, image/svg+xml"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
        </CardContent>
      </Card>
    </div>
  );
}
