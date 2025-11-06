'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import type { Review, Product } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import StarRating from './star-rating';
import { Separator } from '../ui/separator';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const reviewSchema = z.object({
  comment: z.string().min(10, 'Le commentaire doit comporter au moins 10 caractères.'),
  rating: z.number().min(1, 'Une note est requise.').max(5),
});

const ReviewForm = ({ productId, onReviewAdded }: { productId: string, onReviewAdded: () => void }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch product to update rating
  const productRef = useMemoFirebase(() => doc(firestore, 'products', productId), [firestore, productId]);
  const { data: product } = useDoc<Product>(productRef);
  const { data: reviews } = useCollection<Review>(
    useMemoFirebase(() => query(collection(firestore, 'products', productId, 'reviews')), [firestore, productId])
  );


  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { comment: '', rating: 0 },
  });

  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    if (!user || !firestore || !product || !reviews) return;

    setIsSubmitting(true);
    
    const reviewData = {
        userId: user.uid,
        userName: user.displayName || 'Anonyme',
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        rating: values.rating,
        comment: values.comment,
        createdAt: new Date().toISOString(),
    };

    const reviewsCollection = collection(firestore, 'products', productId, 'reviews');
    
    try {
        await addDoc(reviewsCollection, reviewData);
        
        // --- Start: Update product average rating ---
        const totalReviews = reviews.length + 1;
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0) + values.rating;
        const averageRating = totalRating / totalReviews;

        const productUpdateData = {
            reviewCount: totalReviews,
            averageRating: averageRating
        };

        await updateDoc(productRef, productUpdateData);
        // --- End: Update product average rating ---
        
        toast({ title: 'Avis soumis avec succès' });
        form.reset({ comment: '', rating: 0 });
        onReviewAdded();

    } catch (error) {
        if ((error as any).code === 'permission-denied') {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: reviewsCollection.path,
                operation: 'create',
                requestResourceData: reviewData
            }));
        } else {
            console.error("An unexpected error occurred:", error);
             toast({
                variant: 'destructive',
                title: 'Erreur',
                description: "Une erreur inattendue s'est produite lors de la soumission de l'avis."
            });
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
        <div className="p-4 border-dashed border-2 rounded-lg text-center bg-muted/50">
            <p className="text-muted-foreground">Veuillez vous connecter pour laisser un avis.</p>
            <Button asChild variant="link"><Link href="/login">Se connecter</Link></Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <StarRating rating={field.value} onRatingChange={field.onChange} interactive />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="Partagez votre avis sur le produit..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Soumettre l'avis
        </Button>
      </form>
    </Form>
  );
};

const ReviewItem = ({ review }: { review: Review }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="flex gap-4">
            <Avatar>
                <AvatarImage src={review.userAvatar} alt={review.userName}/>
                <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="flex items-center gap-2">
                    <p className="font-semibold">{review.userName}</p>
                    <span className='text-xs text-muted-foreground'>{formatDate(review.createdAt)}</span>
                </div>
                <StarRating rating={review.rating} />
                <p className="mt-2 text-muted-foreground text-sm">{review.comment}</p>
            </div>
        </div>
    )
}

export default function ProductReviews({ productId }: { productId: string }) {
  const firestore = useFirestore();
  const [key, setKey] = useState(0); // Used to force a refetch

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products', productId, 'reviews'), orderBy('createdAt', 'desc'));
  }, [firestore, productId, key]);

  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
  
  const handleReviewAdded = () => {
    // Force the useCollection hook to re-run by changing its dependency 'key'
    setKey(prev => prev + 1); 
  }

  return (
    <div className="bg-muted/40 py-12 md:py-16">
      <div className="container grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="font-headline text-2xl md:text-3xl mb-6">Laisser un avis</h3>
          <ReviewForm productId={productId} onReviewAdded={handleReviewAdded} />
        </div>
        <div>
          <h3 className="font-headline text-2xl md:text-3xl mb-6">Avis des clients</h3>
          <div className="space-y-6">
            {isLoading && Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            ))}
            {!isLoading && reviews && reviews.length > 0 ? (
              reviews.map((review) => <ReviewItem key={review.id} review={review} />)
            ) : (
              !isLoading && <p className="text-muted-foreground">Aucun avis pour ce produit pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
