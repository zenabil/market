'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import type { WishlistItem } from "@/lib/placeholder-data";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import { useCallback } from "react";
import { useToast } from "./use-toast";

export function useWishlist() {
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
                        title: 'أزيل من قائمة الرغبات',
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
                        title: 'أضيف إلى قائمة الرغبات',
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
    }, [user, firestore, wishlist, toast]);
    
    return { wishlist, isWishlistLoading, error, toggleWishlist };
}
