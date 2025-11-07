
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useUser, useCollection, useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, doc, runTransaction } from 'firebase/firestore';
import type { Review } from '@/lib/placeholder-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import StarRating from '../product/star-rating';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-provider';

interface ReviewFormProps {
    targetId: string;
    targetCollection: 'products' | 'recipes';
    onReviewAdded: () => void;
}

const ReviewForm = ({ targetId, targetCollection, onReviewAdded }: ReviewFormProps) => {
  const { t } = useLanguage();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewSchema = z.object({
    comment: z.string().min(10, {message: t('reviews.validation.comment')}),
    rating: z.number().min(1, {message: t('reviews.validation.rating')}).max(5),
  });

  const targetRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, targetCollection, targetId);
  }, [firestore, targetCollection, targetId]);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { comment: '', rating: 0 },
  });

  const onSubmit = async (values: z.infer<typeof reviewSchema>) => {
    if (!user || !firestore || !targetRef) return;

    setIsSubmitting(true);
    
    const newReview = {
        userId: user.uid,
        userName: user.displayName || t('reviews.anonymous'),
        userAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
        rating: values.rating,
        comment: values.comment,
        createdAt: new Date().toISOString(),
    };

    const reviewsCollection = collection(targetRef, 'reviews');
    
    try {
        await runTransaction(firestore, async (transaction) => {
            // 1. Add the new review
            const newReviewRef = doc(reviewsCollection);
            transaction.set(newReviewRef, newReview);

            // 2. Get current reviews to calculate new average
            const reviewsSnapshot = await getDocs(query(reviewsCollection));
            const existingReviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);

            // 3. Calculate new average rating and count
            const totalReviews = existingReviews.length + 1;
            const totalRating = existingReviews.reduce((sum, review) => sum + review.rating, 0) + values.rating;
            const averageRating = totalRating / totalReviews;

            // 4. Update the parent document (product or recipe)
            transaction.update(targetRef, {
                reviewCount: totalReviews,
                averageRating: averageRating
            });
        });
        
        toast({ title: t('reviews.success.title') });
        form.reset({ comment: '', rating: 0 });
        onReviewAdded();

    } catch (error) {
        if ((error as any).code === 'permission-denied') {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: reviewsCollection.path,
                operation: 'create',
                requestResourceData: newReview
            }));
        } else {
            console.error("An unexpected error occurred:", error);
             toast({
                variant: 'destructive',
                title: t('reviews.error.title'),
                description: t('reviews.error.description')
            });
        }
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
        <div className="p-4 border-dashed border-2 rounded-lg text-center bg-muted/50">
            <p className="text-muted-foreground">{t('reviews.loginPrompt.message')}</p>
            <Button asChild variant="link"><Link href="/login">{t('reviews.loginPrompt.button')}</Link></Button>
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
                <Textarea placeholder={t('reviews.commentPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('reviews.submitButton')}
        </Button>
      </form>
    </Form>
  );
};

const ReviewItem = ({ review }: { review: Review }) => {
    const { t } = useLanguage();
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(t('locale'), { year: 'numeric', month: 'long', day: 'numeric' });
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

interface ReviewsSectionProps {
    targetId: string;
    targetCollection: 'products' | 'recipes';
    onReviewChange: () => void;
}

export default function ReviewsSection({ targetId, targetCollection, onReviewChange }: ReviewsSectionProps) {
  const { t } = useLanguage();
  const firestore = useFirestore();

  const reviewsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `${targetCollection}/${targetId}/reviews`), orderBy('createdAt', 'desc'));
  }, [firestore, targetCollection, targetId, onReviewChange]);

  const { data: reviews, isLoading } = useCollection<Review>(reviewsQuery);
  
  return (
    <div className="bg-muted/40 py-12 md:py-16">
      <div className="container grid md:grid-cols-2 gap-12">
        <div>
          <h3 className="font-headline text-2xl md:text-3xl mb-6">{t('reviews.leaveReview')}</h3>
          <ReviewForm targetId={targetId} targetCollection={targetCollection} onReviewAdded={onReviewChange} />
        </div>
        <div>
          <h3 className="font-headline text-2xl md:text-3xl mb-6">{t('reviews.customerReviews')}</h3>
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
              !isLoading && <p className="text-muted-foreground">{t('reviews.noReviews')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

    