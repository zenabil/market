'use client';

import { useCollection, useCollectionGroup, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import type { Order } from "@/lib/placeholder-data";
import { collection, query, orderBy, collectionGroup as fsCollectionGroup } from "firebase/firestore";
import React from "react";
import { useUserRole } from "./use-user-role";

/**
 * Custom hook to fetch orders from Firestore based on user role.
 * For admins, it fetches all orders across all users, sorted by date.
 * For regular users, it fetches only their own orders, sorted by date.
 * @returns An object containing the list of orders and a loading state.
 */
export function useOrders() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { isAdmin, isRoleLoading } = useUserRole();

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || isRoleLoading) return null;

        if (isAdmin) {
            // Admin: Fetch all orders from the collection group
            return query(fsCollectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc'));
        } else if (user) {
            // Regular user: Fetch only their own orders
            return query(collection(firestore, `users/${user.uid}/orders`), orderBy('orderDate', 'desc'));
        }

        return null;
    }, [firestore, user, isAdmin, isRoleLoading]);
    
    // The type of hook used depends on the user's role
    const { data: adminData, isLoading: isAdminLoading } = useCollectionGroup<Order>(isAdmin ? ordersQuery : null);
    const { data: userData, isLoading: isUserLoading } = useCollection<Order>(!isAdmin ? ordersQuery : null);
    
    const orders = isAdmin ? adminData : userData;
    const isLoading = isRoleLoading || isAdminLoading || isUserLoading;

    return { orders, isLoading };
}
