'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import type { WishlistItem } from "@/lib/placeholder-data";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useCallback } from "react";
import { useToast } from "./use-toast";
import { useLanguage } from "./use-language";

export function useWishlist() {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const wishlistQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, `users/${user.uid}/wishlist`);
    }, [user, firestore]);
    
    const { data: wishlist, isLoading: isWishlistLoading, error } = useCollection<WishlistItem>(wishlistQuery);
    
    const toggleWishlist = useCallback((productId: string) => {
        if (!user || !firestore) return;
        
        const isWishlisted = !!wishlist?.find(item => item.id === productId);
        const wishlistItemRef = doc(firestore, `users/${user.uid}/wishlist`, productId);

        if (isWishlisted) {
            deleteDoc(wishlistItemRef)
                .then(() => {
                    toast({
                        title: t('wishlist.removed_title'),
                    });
                })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: wishlistItemRef.path,
                        operation: 'delete'
                    }));
                });
        } else {
            const newItem = {
                productId: productId,
                addedAt: new Date().toISOString(),
            };
            setDoc(wishlistItemRef, newItem)
                .then(() => {
                    toast({
                        title: t('wishlist.added_title'),
                    });
                })
                .catch(err => {
                    errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: wishlistItemRef.path,
                        operation: 'create',
                        requestResourceData: newItem,
                    }));
                });
        }
    }, [user, firestore, wishlist, t, toast]);
    
    return { wishlist, isWishlistLoading, error, toggleWishlist };
}
