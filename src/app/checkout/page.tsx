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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { placeOrder } from '@/lib/services/order';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  address: z.string().min(10, { message: 'Address must be at least 10 characters.' }),
  city: z.string().min(2, { message: 'City must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Phone must be at least 10 characters.' }),
});

export default function CheckoutPage() {
  const { t, locale } = useLanguage();
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: 'Tlemcen',
      phone: '',
    },
  });
  
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
    if (totalItems === 0) {
      router.push('/');
    }
  }, [user, totalItems, router]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' }).format(amount);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) return;

    setIsProcessing(true);

    try {
        await placeOrder(firestore, user.uid, {
            shippingAddress: `${values.name}, ${values.address}, ${values.city}`,
            items,
            totalAmount: totalPrice,
            itemCount: totalItems,
        });
        
        toast({
            title: t('checkout.order_placed_title'),
            description: t('checkout.order_placed_desc'),
        });
        
        clearCart();
        router.push('/dashboard/orders');
    } catch (error) {
        console.error("Error placing order: ", error);
        toast({
            variant: "destructive",
            title: t('checkout.order_failed_title'),
            description: (error instanceof Error) ? error.message : t('checkout.order_failed_desc'),
        });
    } finally {
        setIsProcessing(false);
    }
  }
  
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">{t('checkout.title')}</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('checkout.shipping_info')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('checkout.full_name')}</FormLabel>
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
                        <FormLabel>{t('checkout.address')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('checkout.city')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>{t('checkout.phone')}</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('checkout.order_summary')}</CardTitle>
                    <CardDescription>{t('checkout.item_count', { count: totalItems })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                     {items.map(item => (
                         <div key={item.id} className="flex justify-between items-center">
                            <div className='flex items-center gap-4'>
                                <Image src={item.images[0]} alt={item.name[locale]} width={48} height={48} className="rounded-md" />
                                <div>
                                    <p className="font-medium text-sm">{item.name[locale]}</p>
                                    <p className="text-sm text-muted-foreground">{t('checkout.quantity')}: {item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-medium text-sm">{formatCurrency(item.price * (1 - item.discount / 100) * item.quantity)}</p>
                         </div>
                     ))}
                   </div>
                   <Separator />
                   <div className="flex justify-between font-semibold">
                       <span>{t('checkout.subtotal')}</span>
                       <span>{formatCurrency(totalPrice)}</span>
                   </div>
                    <div className="flex justify-between font-semibold">
                       <span>{t('checkout.shipping')}</span>
                       <span>{t('checkout.shipping_cost')}</span>
                   </div>
                   <Separator />
                    <div className="flex justify-between font-bold text-lg">
                       <span>{t('checkout.total')}</span>
                       <span>{formatCurrency(totalPrice)}</span>
                   </div>
                </CardContent>
            </Card>
             <Button 
                type="submit" 
                size="lg" 
                className="w-full mt-8 font-bold text-base py-6"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isProcessing}
            >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('checkout.place_order')}
            </Button>
        </div>
      </div>
    </div>
  );
}
