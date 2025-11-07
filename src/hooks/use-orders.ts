'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import type { Order } from "@/lib/placeholder-data";
import { collection, query, orderBy, collectionGroup as fsCollectionGroup } from "firebase/firestore";
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
    
    // We can use useCollection for both because a collectionGroup query is also a Query type.
    const { data: orders, isLoading: areOrdersLoading, refetch } = useCollection<Order>(ordersQuery);
    
    const isLoading = isRoleLoading || areOrdersLoading;

    return { orders, isLoading, refetch };
}
