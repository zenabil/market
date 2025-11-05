'use client';

import { useMemo, type DependencyList } from 'react';
import { Query, CollectionReference, DocumentReference } from 'firebase/firestore';

/**
 * A wrapper around React's useMemo that "tags" the created Firestore reference or query.
 * This allows other hooks like useCollection and useDoc to verify that their inputs have been
 * correctly memoized, preventing performance issues and infinite loops.
 *
 * @param factory The function that creates the Firestore reference or query.
 * @param deps The dependency array for the memoization.
 * @returns The memoized Firestore reference or query, with a non-enumerable `__memo` property.
 */
export function useMemoFirebase<T extends Query | CollectionReference | DocumentReference | null | undefined>(factory: () => T, deps: DependencyList): T {
    const memoized = useMemo(factory, deps);

    if (memoized && (typeof memoized === 'object')) {
        // Here we are marking the object with a non-enumerable property.
        // This is a way to track if the object was created by this hook
        // without polluting the object's visible properties.
        Object.defineProperty(memoized, '__memo', {
            value: true,
            writable: false,
            enumerable: false,
            configurable: true, // Allow it to be re-defined in subsequent renders if needed
        });
    }

    return memoized;
}
