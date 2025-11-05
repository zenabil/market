'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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
import { Upload } from 'lucide-react';

const formSchema = z.object({
  siteName: z.string().min(2, { message: 'Site name must be at least 2 characters.' }),
  logo: z.any(),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  address: z.string().min(10, { message: 'Address must be at least 10 characters.' }),
});

export default function SettingsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      siteName: 'Tlemcen Smart Supermarket',
      phone: '+213 123 456 789',
      address: '123 Rue de la Liberté, Tlemcen, Algérie',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: t('dashboard.settings_updated_title'),
      description: t('dashboard.settings_updated_desc'),
    });
  }

  return (
    <div className="container py-8 md:py-12">
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
                        <div className="flex-1">
                           <Input type="file" onChange={(e) => field.onChange(e.target.files)} />
                        </div>
                        <Button type="button" variant="outline" size="icon">
                            <Upload className="h-4 w-4" />
                        </Button>
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
