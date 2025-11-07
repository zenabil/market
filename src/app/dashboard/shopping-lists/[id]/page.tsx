
'use client';

import React from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { ShoppingList, Product } from '@/lib/placeholder-data';
import { Loader2, ArrowLeft, Save, Sparkles, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { analyzeShoppingList } from '@/ai/flows/analyze-shopping-list';
import Image from 'next/image';
import { useCart } from '@/hooks/use-cart';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/language-provider';

function ShoppingListDetail() {
    const { t } = useLanguage();
    const { id: listId } = useParams();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { addItem } = useCart();
    const [isSaving, setIsSaving] = React.useState(false);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analyzedProductNames, setAnalyzedProductNames] = React.useState<string[]>([]);
    
    const listContentSchema = z.object({
      items: z.string(),
    });

    const listDocRef = useMemoFirebase(() => {
        if (!user || !firestore || !listId) return null;
        return doc(firestore, `users/${user.uid}/shopping-lists`, listId as string);
    }, [user, firestore, listId]);

    const { data: shoppingList, isLoading: isListLoading } = useDoc<ShoppingList>(listDocRef);
    
    const productsQuery = useMemoFirebase(() => {
        if (!firestore || analyzedProductNames.length === 0) return null;
        return query(collection(firestore, 'products'), where('name', 'in', analyzedProductNames));
    }, [firestore, analyzedProductNames]);

    const { data: foundProducts, isLoading: areProductsLoading } = useCollection<Product>(productsQuery);

    const form = useForm<z.infer<typeof listContentSchema>>({
        resolver: zodResolver(listContentSchema),
        defaultValues: { items: '' },
    });

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router]);

    React.useEffect(() => {
        if (shoppingList) {
            form.reset({
                items: shoppingList.items.join('\n'),
            });
        }
    }, [shoppingList, form]);

    async function onSubmit(values: z.infer<typeof listContentSchema>) {
        if (!listDocRef) return;
        setIsSaving(true);
        
        const itemsArray = values.items.split('\n').map(item => item.trim()).filter(Boolean);
        const updateData = { items: itemsArray };
        
        updateDoc(listDocRef, updateData)
            .then(() => {
                toast({ title: t('dashboard.shoppingLists.detail.toast.saved') });
            })
            .catch(error => {
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: listDocRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                }));
            })
            .finally(() => {
                setIsSaving(false);
            });
    }

    const handleAnalyzeList = async () => {
        const listText = form.getValues('items');
        if (!listText.trim()) {
            toast({ variant: 'destructive', title: t('dashboard.shoppingLists.detail.toast.emptyList') });
            return;
        }
        setIsAnalyzing(true);
        setAnalyzedProductNames([]);
        try {
            const result = await analyzeShoppingList({ listText });
            if (result.products && result.products.length > 0) {
                 // Firestore 'in' query is limited to 30 items.
                 setAnalyzedProductNames(result.products.slice(0, 30));
                 toast({ title: t('dashboard.shoppingLists.detail.toast.analysisComplete.title'), description: t('dashboard.shoppingLists.detail.toast.analysisComplete.description').replace('{{count}}', result.products.length.toString()) });
            } else {
                toast({ title: t('dashboard.shoppingLists.detail.toast.analysisComplete.title'), description: t('dashboard.shoppingLists.detail.toast.analysisComplete.noProducts') });
            }
        } catch (error) {
            console.error("Failed to analyze list:", error);
            toast({ variant: 'destructive', title: t('dashboard.shoppingLists.detail.toast.analysisError') });
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleAddToCart = (product: Product) => {
        addItem(product);
        toast({
          title: t('dashboard.shoppingLists.detail.toast.addedToCart.title'),
          description: t('dashboard.shoppingLists.detail.toast.addedToCart.description').replace('{{name}}', product.name),
        });
    }

    const isLoading = isUserLoading || isListLoading;

    if (isLoading) {
        return (
            <div className="container py-8 md:py-12">
                <div className="flex items-center gap-4 mb-8">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-96 w-full" />
                <div className="flex justify-end mt-4">
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        );
    }
    
    if (!shoppingList) {
        return notFound();
    }

    return (
        <div className="container py-8 md:py-12">
             <div className="flex items-center gap-4 mb-8">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard/shopping-lists">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="font-headline text-3xl md:text-4xl">{shoppingList.name}</h1>
                </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
                <div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="items"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('dashboard.shoppingLists.detail.content')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                rows={15}
                                                placeholder={t('dashboard.shoppingLists.detail.placeholder')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-between items-center">
                                 <Button type="button" onClick={handleAnalyzeList} disabled={isAnalyzing}>
                                    {isAnalyzing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    {t('dashboard.shoppingLists.detail.analyze')}
                                </Button>
                                <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    {t('dashboard.common.save')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
                <div>
                    <h3 className="font-headline text-2xl mb-4">{t('dashboard.shoppingLists.detail.foundProducts')}</h3>
                    <div className="space-y-4 pr-2 overflow-y-auto max-h-[450px] border rounded-md p-4 bg-muted/40">
                         {(isAnalyzing || areProductsLoading) && Array.from({ length: 3 }).map((_, i) => (
                             <div key={i} className="flex gap-4 items-center">
                                <Skeleton className="h-16 w-16" />
                                <div className="space-y-2 flex-grow">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-1/4" />
                                </div>
                                <Skeleton className="h-10 w-10" />
                            </div>
                         ))}
                         {!isAnalyzing && !areProductsLoading && foundProducts && foundProducts.length > 0 && (
                             foundProducts.map(product => (
                                <div key={product.id}>
                                    <div className="flex gap-4 items-center">
                                        <Image src={product.images[0]} alt={product.name} width={64} height={64} className="rounded-md border object-cover" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{product.name}</p>
                                            <p className="text-sm text-muted-foreground">{new Intl.NumberFormat(t('locale'), { style: 'currency', currency: 'DZD' }).format(product.price)}</p>
                                        </div>
                                        <Button size="icon" onClick={() => handleAddToCart(product)}>
                                            <ShoppingCart className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Separator className="mt-4" />
                                </div>
                             ))
                         )}
                         {!isAnalyzing && !areProductsLoading && (!foundProducts || foundProducts.length === 0) && (
                            <div className="text-center p-8 text-muted-foreground">
                                <p>{t('dashboard.shoppingLists.detail.analyzePrompt')}</p>
                            </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShoppingListDetailPage() {
    return <ShoppingListDetail />;
}
