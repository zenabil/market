'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type SiteSettings = {
  address?: string;
  phone?: string;
};


export default function ContactPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'site'), [firestore]);
  const { data: settings, isLoading } = useDoc<SiteSettings>(settingsRef);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: t('contact.form.success_title'),
      description: t('contact.form.success_desc'),
    });
    form.reset();
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">{t('contact.title')}</h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">{t('contact.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="font-headline text-2xl mb-6">{t('contact.form.title')}</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.form.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('contact.form.name_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.form.email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('contact.form.email_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.form.subject')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('contact.form.subject_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('contact.form.message')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('contact.form.message_placeholder')} rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg">{t('contact.form.send')}</Button>
            </form>
          </Form>
        </div>
        <div className="space-y-8">
            <div>
                 <h2 className="font-headline text-2xl mb-6">{t('contact.info.title')}</h2>
                 <div className="space-y-4 text-muted-foreground">
                    <div className="flex items-start gap-4">
                        <MapPin className="h-6 w-6 mt-1 text-primary"/>
                        <div>
                            <h3 className="font-semibold text-foreground">{t('contact.info.address_title')}</h3>
                            {isLoading ? <Skeleton className="h-5 w-48 mt-1" /> : <p>{settings?.address || '123 Rue de la Liberté, Tlemcen, Algérie'}</p>}
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Phone className="h-6 w-6 mt-1 text-primary"/>
                        <div>
                            <h3 className="font-semibold text-foreground">{t('contact.info.phone_title')}</h3>
                             {isLoading ? <Skeleton className="h-5 w-32 mt-1" /> : <p>{settings?.phone || '+213 123 456 789'}</p>}
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Mail className="h-6 w-6 mt-1 text-primary"/>
                        <div>
                            <h3 className="font-semibold text-foreground">{t('contact.info.email_title')}</h3>
                            <p>contact@tlemcensmart.dz</p>
                        </div>
                    </div>
                 </div>
            </div>
             <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden">
                <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d52368.10657989392!2d-1.348624100588629!3d34.88219460515152!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd78c9a0b3a4a6fd%3A0x24b74f5ac4573170!2sTlemcen%2C%20Algeria!5e0!3m2!1sen!2sus!4v1720546961817!5m2!1sen!2sus"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </div>
      </div>
    </div>
  );
}
