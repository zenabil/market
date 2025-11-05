'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Category } from "@/lib/placeholder-data";
import { collection, query } from "firebase/firestore";

/**
 * Custom hook to fetch and memoize the categories from Firestore.
 * @returns An object containing the list of categories and a loading state.
 */
export function useCategories() {
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, "categories")) : null),
    [firestore]
  );

  const { data: categories, isLoading: areCategoriesLoading } = useCollection<Category>(categoriesQuery);

  return { categories, areCategoriesLoading };
}
