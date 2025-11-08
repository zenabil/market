
'use client';

import {
  Firestore,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  doc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Applies a discount to all products within a specific category using a batched write.
 *
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} categoryId - The ID of the category to apply the discount to.
 * @param {number} discount - The discount percentage to apply (0-100).
 * @returns {Promise<number>} A promise that resolves with the number of products updated.
 */
export async function applyDiscountToCategory(
  db: Firestore,
  categoryId: string,
  discount: number
): Promise<number> {
  if (discount < 0 || discount > 100) {
    throw new Error('Le pourcentage de réduction doit être compris entre 0 et 100.');
  }

  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('categoryId', '==', categoryId));

  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 0; // No products in this category
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(productDoc => {
      const productRef = doc(db, 'products', productDoc.id);
      batch.update(productRef, { discount });
    });

    await batch.commit();
    return querySnapshot.size;

  } catch (error: any) {
    if (error.code === 'permission-denied' || (error.name === 'FirebaseError' && error.message.includes('permission'))) {
        const permissionError = new FirestorePermissionError({
            path: `products`,
            operation: 'update',
            requestResourceData: { discount, categoryId },
        });
        errorEmitter.emit('permission-error', permissionError);
    }
     // Re-throw to be caught by the calling component
    throw new Error(error.message || "Impossible d'appliquer la réduction.");
  }
}
