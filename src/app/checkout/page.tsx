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
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, TicketPercent } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { placeOrder } from '@/lib/services/order';
import { collection, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { User as FirestoreUser } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';

type Coupon = {
  id: string;
  code: string;
  discountPercentage: number;
  expiryDate: string; // ISO string
  isActive: boolean;
};


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
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: firestoreUser } = useDoc<FirestoreUser>(userDocRef);

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

  React.useEffect(() => {
    if (firestoreUser) {
        form.reset({
            name: firestoreUser.name || '',
            address: firestoreUser.addresses?.[0]?.street || '',
            city: firestoreUser.addresses?.[0]?.city || 'Tlemcen',
            phone: firestoreUser.phone || '',
        });
    } else if (user) {
        form.reset({
            name: user.displayName || '',
            address: '',
            city: 'Tlemcen',
            phone: user.phoneNumber || '',
        })
    }
  }, [firestoreUser, user, form]);

  const finalTotalPrice = appliedCoupon
    ? totalPrice * (1 - appliedCoupon.discountPercentage / 100)
    : totalPrice;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !firestore) return;
    setIsApplyingCoupon(true);

    const couponsRef = collection(firestore, 'coupons');
    const q = query(couponsRef, where('code', '==', couponCode.trim()));

    getDocs(q).then(querySnapshot => {
        if (querySnapshot.empty) {
            toast({ variant: 'destructive', title: t('checkout.coupon.invalid') });
            setAppliedCoupon(null);
            return;
        }

        const couponDoc = querySnapshot.docs[0];
        const couponData = { id: couponDoc.id, ...couponDoc.data() } as Coupon;
        
        const now = new Date();
        const expiry = new Date(couponData.expiryDate);

        if (!couponData.isActive || now > expiry) {
            toast({ variant: 'destructive', title: t('checkout.coupon.expired') });
            setAppliedCoupon(null);
            return;
        }
        
        setAppliedCoupon(couponData);
        toast({ title: t('checkout.coupon.applied', { code: couponData.code }) });
    }).catch(error => {
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: 'coupons'
        });
        errorEmitter.emit('permission-error', contextualError);
    }).finally(() => {
        setIsApplyingCoupon(false);
    });
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'DZD' }).format(amount);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) return;

    setIsProcessing(true);

    try {
      await placeOrder(firestore, user.uid, {
        shippingAddress: `${values.name}, ${values.address}, ${values.city}`,
        phone: values.phone,
        items,
        totalAmount: finalTotalPrice,
      });

      toast({
        title: t('checkout.order_placed_title'),
        description: t('checkout.order_placed_desc'),
      });
      
      clearCart();
      router.push('/dashboard/orders');

    } catch (error: any) {
      // Errors from placeOrder (like stock issues) will be caught here.
      // Permission errors are handled by the emitter in placeOrder.
      toast({
        variant: "destructive",
        title: t('checkout.order_failed_title'),
        description: error.message || t('checkout.order_failed_desc'),
      });
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-2 gap-12" id="checkout-form">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.shipping_info')}</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-6">
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
                  </div>
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
                                  <div className="relative h-12 w-12 flex-shrink-0">
                                    <Image src={item.images[0]} alt={item.name[locale]} fill className="rounded-md object-cover" />
                                  </div>
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
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input 
                            placeholder={t('checkout.coupon.placeholder')}
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className='flex-grow'
                            disabled={isApplyingCoupon || !!appliedCoupon}
                          />
                          <Button 
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon || !couponCode || !!appliedCoupon}
                          >
                            {isApplyingCoupon && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {t('checkout.coupon.apply')}
                          </Button>
                        </div>
                        {appliedCoupon && (
                          <p className="text-sm text-primary flex items-center gap-2">
                            <TicketPercent className="h-4 w-4" />
                            <span>{t('checkout.coupon.discount_applied', { code: appliedCoupon.code, percentage: appliedCoupon.discountPercentage })}</span>
                          </p>
                        )}
                      </div>
                     <Separator />
                     <div className="flex justify-between font-semibold">
                         <span>{t('checkout.subtotal')}</span>
                         <span>{formatCurrency(totalPrice)}</span>
                     </div>
                      {appliedCoupon && (
                        <div className="flex justify-between font-semibold text-primary">
                          <span>{t('checkout.coupon.discount_label')}</span>
                          <span>- {formatCurrency(totalPrice - finalTotalPrice)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                         <span>{t('checkout.shipping')}</span>
                         <span>{t('checkout.shipping_cost')}</span>
                     </div>
                     <Separator />
                      <div className="flex justify-between font-bold text-lg">
                         <span>{t('checkout.total')}</span>
                         <span>{formatCurrency(finalTotalPrice)}</span>
                     </div>
                  </CardContent>
              </Card>
               <Button 
                  type="submit" 
                  form="checkout-form"
                  size="lg" 
                  className="w-full mt-8 font-bold text-base py-6"
                  disabled={isProcessing}
              >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('checkout.place_order')}
              </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
