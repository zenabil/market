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
import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, TicketPercent, CreditCard, Calendar, Lock } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { placeOrder } from '@/lib/services/order';
import { collection, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { User as FirestoreUser } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';
import type { Coupon } from '@/lib/placeholder-data';
import { useLanguage } from '@/contexts/language-provider';

type SiteSettings = {
  deliveryFeeBase?: number;
  deliveryFeeThreshold?: number;
  deliveryFeeHigh?: number;
};

export default function CheckoutPage() {
  const { t } = useLanguage();

  const shippingFormSchema = z.object({
    name: z.string().min(2, { message: t('checkout.validation.name') }),
    address: z.string().min(10, { message: t('checkout.validation.address') }),
    city: z.string().min(2, { message: t('checkout.validation.city') }),
    phone: z.string().min(10, { message: t('checkout.validation.phone') }),
  });
  
  const paymentFormSchema = z.object({
      cardNumber: z.string().min(16, t('checkout.validation.cardNumber')).max(16, t('checkout.validation.cardNumber')),
      expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, t('checkout.validation.expiryDate')),
      cvc: z.string().min(3, t('checkout.validation.cvc')).max(4, t('checkout.validation.cvc')),
  });


  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
  const [step, setStep] = React.useState<'details' | 'payment'>('details');
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  
  const { data: firestoreUser } = useDoc<FirestoreUser>(userDocRef);

  const settingsRef = useMemoFirebase(() => doc(firestore, 'settings', 'site'), [firestore]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const subTotalAfterDiscount = appliedCoupon
    ? totalPrice * (1 - appliedCoupon.discountPercentage / 100)
    : totalPrice;
    
  const deliveryFee = React.useMemo(() => {
    const baseFee = settings?.deliveryFeeBase ?? 100;
    const highFee = settings?.deliveryFeeHigh ?? 200;
    const threshold = settings?.deliveryFeeThreshold ?? 4000;
    
    if (subTotalAfterDiscount >= threshold) {
      return highFee;
    }
    return baseFee;
  }, [subTotalAfterDiscount, settings]);


  const finalTotalPrice = subTotalAfterDiscount + deliveryFee;

  const shippingForm = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      name: '',
      address: '',
      city: 'Tlemcen',
      phone: '',
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentFormSchema>>({
      resolver: zodResolver(paymentFormSchema),
      defaultValues: { cardNumber: '', expiryDate: '', cvc: '' }
  });
  
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
    if (totalItems === 0 && !isProcessing) { // Don't redirect if processing payment
      router.push('/');
    }
  }, [user, totalItems, router, isProcessing]);

  React.useEffect(() => {
    if (firestoreUser) {
        shippingForm.reset({
            name: firestoreUser.name || '',
            address: firestoreUser.addresses?.[0]?.street || '',
            city: firestoreUser.addresses?.[0]?.city || 'Tlemcen',
            phone: firestoreUser.phone || '',
        });
    } else if (user) {
        shippingForm.reset({
            name: user.displayName || '',
            address: '',
            city: 'Tlemcen',
            phone: user.phoneNumber || '',
        })
    }
  }, [firestoreUser, user, shippingForm]);
  
    React.useEffect(() => {
    if (step === 'payment') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !firestore) return;
    setIsApplyingCoupon(true);
    setAppliedCoupon(null); // Reset previous coupon

    const couponsRef = collection(firestore, 'coupons');
    const q = query(couponsRef, where('code', '==', couponCode.trim()));

    try {
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            toast({ variant: 'destructive', title: t('checkout.coupon.invalid.title'), description: t('checkout.coupon.invalid.description') });
            return;
        }

        const couponDoc = querySnapshot.docs[0];
        const couponData = { id: couponDoc.id, ...couponDoc.data() } as Coupon;
        
        const now = new Date();
        // Firestore timestamps can be seconds/nanoseconds objects, convert to Date
        const expiryDate = (couponData.expiryDate as any).toDate ? (couponData.expiryDate as any).toDate() : new Date(couponData.expiryDate);

        if (!couponData.isActive) {
            toast({ variant: 'destructive', title: t('checkout.coupon.inactive.title'), description: t('checkout.coupon.inactive.description') });
            return;
        }
        
        if (now > expiryDate) {
            toast({ variant: 'destructive', title: t('checkout.coupon.expired.title'), description: t('checkout.coupon.expired.description') });
            return;
        }
        
        setAppliedCoupon(couponData);
        toast({ title: t('checkout.coupon.applied').replace('{{code}}', couponData.code) });
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            operation: 'list',
            path: couponsRef.path,
        }));
        toast({
            variant: 'destructive',
            title: t('checkout.coupon.error.title'),
            description: t('checkout.coupon.error.description'),
        });
    } finally {
        setIsApplyingCoupon(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(t('locale'), { style: 'currency', currency: 'DZD' }).format(amount);
  };

  const handleProceedToPayment = () => {
      setStep('payment');
  }

  async function onFinalSubmit() {
    const shippingValues = shippingForm.getValues();
    if (!user || !firestore) return;

    setIsProcessing(true);

    try {
      await placeOrder(firestore, user.uid, {
        shippingAddress: `${shippingValues.name}, ${shippingValues.address}, ${shippingValues.city}`,
        phone: shippingValues.phone,
        items,
        totalAmount: finalTotalPrice,
      });

      toast({
        title: t('checkout.orderSuccess.title'),
        description: t('checkout.orderSuccess.description'),
      });
      
      clearCart();
      router.push('/dashboard/orders');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('checkout.orderFail.title'),
        description: error.message || t('checkout.orderFail.description'),
      });
    } finally {
      setIsProcessing(false);
    }
  }
  
  if (totalItems === 0 && step === 'details') {
    return null;
  }

  const renderDetailsStep = () => (
      <Form {...shippingForm}>
          <form onSubmit={shippingForm.handleSubmit(handleProceedToPayment)} id="shipping-form">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('checkout.shippingInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-6">
                        <FormField control={shippingForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>{t('checkout.fullName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={shippingForm.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>{t('checkout.address')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={shippingForm.control} name="city" render={({ field }) => (
                            <FormItem><FormLabel>{t('checkout.city')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={shippingForm.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>{t('checkout.phone')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                  </CardContent>
                </Card>
          </form>
      </Form>
  );
  
  const renderPaymentStep = () => (
      <Form {...paymentForm}>
          <form onSubmit={paymentForm.handleSubmit(onFinalSubmit)} id="payment-form">
             <Card>
                <CardHeader>
                    <CardTitle>{t('checkout.paymentDetails')}</CardTitle>
                    <CardDescription>{t('checkout.paymentSimulation')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField control={paymentForm.control} name="cardNumber" render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('checkout.cardNumber')}</FormLabel>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} placeholder="0000 0000 0000 0000" className="pl-10" />
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <div className="grid grid-cols-2 gap-4">
                        <FormField control={paymentForm.control} name="expiryDate" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('checkout.expiryDate')}</FormLabel>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input {...field} placeholder="MM/YY" className="pl-10"/>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={paymentForm.control} name="cvc" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('checkout.cvc')}</FormLabel>
                                <div className="relative">
                                     <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                     <Input {...field} placeholder="123" className="pl-10"/>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                     </div>
                </CardContent>
             </Card>
          </form>
      </Form>
  )

  return (
    <div className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl lg:text-6xl">{t('checkout.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
            {step === 'details' ? t('checkout.step1') : t('checkout.step2')}
        </p>
      </div>
      <div className="grid lg:grid-cols-2 gap-12">
        <div>
            {step === 'details' ? renderDetailsStep() : renderPaymentStep()}
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('checkout.orderSummary')}</CardTitle>
                    <CardDescription>{t('checkout.itemsInCart').replace('{{count}}', totalItems.toString())}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                     {items.map(item => (
                         <div key={item.id} className="flex justify-between items-center">
                            <div className='flex items-center gap-4'>
                                <div className="relative h-12 w-12 flex-shrink-0">
                                  <Image src={item.images[0]} alt={item.name} fill className="rounded-md object-cover" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{item.name}</p>
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
                          placeholder={t('checkout.discountCode')}
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
                          {t('checkout.apply')}
                        </Button>
                      </div>
                      {appliedCoupon && (
                        <p className="text-sm text-primary flex items-center gap-2">
                          <TicketPercent className="h-4 w-4" />
                          <span>{t('checkout.discountApplied').replace('{{code}}', appliedCoupon.code).replace('{{percentage}}', appliedCoupon.discountPercentage.toString())}</span>
                        </p>
                      )}
                    </div>
                   <Separator />
                   <div className="space-y-2">
                       <div className="flex justify-between">
                           <span>{t('checkout.subtotal')}</span>
                           <span>{formatCurrency(subTotalAfterDiscount)}</span>
                       </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-primary">
                            <span>{t('checkout.discount')}</span>
                            <span>- {formatCurrency(totalPrice - subTotalAfterDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                           <span>{t('checkout.shipping')}</span>
                           <span className={cn(deliveryFee === 0 && 'font-semibold')}>
                                {deliveryFee > 0 ? formatCurrency(deliveryFee) : t('checkout.free')}
                           </span>
                       </div>
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
                form={step === 'details' ? 'shipping-form' : 'payment-form'}
                size="lg" 
                className="w-full mt-8 font-bold text-base py-6"
                disabled={isProcessing}
            >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {step === 'details' ? t('checkout.proceedToPayment') : t('checkout.payNow').replace('{{amount}}', formatCurrency(finalTotalPrice))}
            </Button>
        </div>
      </div>
    </div>
  );
}
