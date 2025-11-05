'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Category } from "@/lib/placeholder-data";
import { collection, query } from "firebase/firestore";
import React from "react";

/**
 * Custom hook to fetch and memoize the categories from Firestore.
 * @returns An object containing the list of categories, a loading state, and a function to refetch.
 */
export function useCategories() {
  const firestore = useFirestore();
  const [key, setKey] = React.useState(0);

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "categories")) : null),
    [firestore, key] // Add key to dependencies to allow refetching
  );

  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);

  const refetchCategories = React.useCallback(() => {
    setKey(prevKey => prevKey + 1);
  }, []);

  return { categories, areCategoriesLoading, refetchCategories };
}
