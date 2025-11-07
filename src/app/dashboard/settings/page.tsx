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
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-provider';

export default function SettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const { isAdmin, isRoleLoading } = useUserRole();
  const router = useRouter();

  const formSchema = z.object({
    siteName: z.string().min(2, { message: t('dashboard.settings.validation.siteName') }),
    logoUrl: z.string().url().optional().or(z.literal('')),
    phone: z.string().min(10, { message: t('dashboard.settings.validation.phone') }),
    address: z.string().min(10, { message: t('dashboard.settings.validation.address') }),
    deliveryFeeBase: z.coerce.number().min(0),
    deliveryFeeThreshold: z.coerce.number().min(0),
    deliveryFeeHigh: z.coerce.number().min(0),
  });
  
  type SiteSettings = z.infer<typeof formSchema>;

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
      deliveryFeeBase: 100,
      deliveryFeeThreshold: 4000,
      deliveryFeeHigh: 200,
    },
  });

  useEffect(() => {
    if (!isRoleLoading && !isAdmin) {
        router.replace('/dashboard');
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
                title: t('dashboard.settings.toast.updated.title'),
                description: t('dashboard.settings.toast.updated.description'),
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
            <h1 className="font-headline text-3xl md:text-4xl">{t('dashboard.layout.settings')}</h1>
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.settings.general.title')}</CardTitle>
                    <CardDescription>{t('dashboard.settings.general.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 max-w-2xl">
                    <FormField
                        control={form.control}
                        name="siteName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('dashboard.settings.general.siteName')}</FormLabel>
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
                            <FormLabel>{t('dashboard.settings.general.logo')}</FormLabel>
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
                                    {t('dashboard.settings.general.uploadLogo')}
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
                            <FormLabel>{t('dashboard.settings.general.phone')}</FormLabel>
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
                            <FormLabel>{t('dashboard.settings.general.address')}</FormLabel>
                            <FormControl>
                            <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.settings.delivery.title')}</CardTitle>
                    <CardDescription>{t('dashboard.settings.delivery.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 max-w-2xl">
                    <FormField
                        control={form.control}
                        name="deliveryFeeBase"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('dashboard.settings.delivery.baseFee')}</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deliveryFeeThreshold"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('dashboard.settings.delivery.threshold')}</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="deliveryFeeHigh"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('dashboard.settings.delivery.highFee')}</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.common.saveChanges')}
                </Button>
            </div>
            </form>
        </Form>
    </div>
  );
}
