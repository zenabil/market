'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Coupon } from "@/lib/placeholder-data";
import { collection, query, orderBy } from "firebase/firestore";
import React from "react";

/**
 * Custom hook to fetch and memoize coupons from Firestore.
 * @returns An object containing the list of coupons, a loading state, and a function to refetch.
 */
export function useCoupons() {
  const firestore = useFirestore();
  const [key, setKey] = React.useState(0);

  const couponsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "coupons"), orderBy("expiryDate", "desc")) : null),
    [firestore, key]
  );

  const { data: coupons, isLoading, error } = useCollection<Coupon>(couponsQuery);

  const refetchCoupons = React.useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);

  return { coupons, isLoading, error, refetchCoupons };
}
