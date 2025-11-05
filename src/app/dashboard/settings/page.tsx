'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import React from 'react';

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
import { Upload, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const formSchema = z.object({
  siteName: z.string().min(2, { message: 'Site name must be at least 2 characters.' }),
  logo: z.any().optional(),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  address: z.string().min(10, { message: 'Address must be at least 10 characters.' }),
});

export default function SettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: 'Tlemcen Smart Supermarket',
      phone: '+213 123 456 789',
      address: '123 Rue de la Liberté, Tlemcen, Algérie',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would typically handle the upload and saving of settings
    toast({
      title: t('dashboard.settings_updated_title'),
      description: t('dashboard.settings_updated_desc'),
    });
  }

  return (
    <div className="container py-8 md:py-12">
        <div className="flex items-center gap-4 mb-8">
            <Button asChild variant="outline" size="icon">
            <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
            </Link>
            </Button>
            <h1 className="font-headline text-3xl md:text-4xl">{t('dashboard.nav.settings')}</h1>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.nav.settings')}</CardTitle>
          <CardDescription>{t('dashboard.settings_desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dashboard.settings.site_name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dashboard.settings.logo')}</FormLabel>
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
                                    form.setValue('logo', null);
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
                            {t('dashboard.settings.upload_logo')}
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
                    <FormLabel>{t('dashboard.settings.phone')}</FormLabel>
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
                    <FormLabel>{t('dashboard.settings.address')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit">{t('dashboard.save_changes')}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
