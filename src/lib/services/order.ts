import {
  Firestore,
  writeBatch,
  doc,
  collection,
  serverTimestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import type { CartItem } from '@/contexts/cart-provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface PlaceOrderParams {
  shippingAddress: string;
  items: CartItem[];
  totalAmount: number;
}

/**
 * Places an order in a transaction to ensure atomicity.
 * This function will:
 * 1. Create a new order document for the user.
 * 2. For each item in the order, decrement the product's stock and increment its 'sold' count.
 * 3. Update the user's total order count and total spent amount.
 *
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} userId - The ID of the user placing the order.
 * @param {PlaceOrderParams} orderDetails - The details of the order.
 * @returns {Promise<void>} A promise that resolves when the transaction is initiated. The UI should not wait for it to complete.
 */
export function placeOrder(db: Firestore, userId: string, orderDetails: PlaceOrderParams): Promise<void> {
  const { shippingAddress, items, totalAmount } = orderDetails;

  const userRef = doc(db, 'users', userId);
  const newOrderRef = doc(collection(db, `users/${userId}/orders`));

  const transactionPromise = runTransaction(db, async (transaction) => {
    // 1. Get current user data to ensure it exists
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) {
      throw new Error("User does not exist.");
    }

    // 2. Check stock for all products in the cart
    for (const item of items) {
      const productRef = doc(db, 'products', item.id);
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error(`Product ${item.name.en} not found.`);
      }
      const currentStock = productDoc.data().stock;
      if (currentStock < item.quantity) {
        throw new Error(`Not enough stock for ${item.name.en}. Available: ${currentStock}, Requested: ${item.quantity}`);
      }
    }
    
    const newOrderData = {
      userId,
      orderDate: new Date().toISOString(),
      totalAmount,
      status: 'Pending',
      shippingAddress,
      items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price * (1 - (item.discount || 0) / 100),
      })),
    };

    // 3. Create the new order
    transaction.set(newOrderRef, newOrderData);

    // 4. Update product stock and sold counts
    for (const item of items) {
      const productRef = doc(db, 'products', item.id);
      transaction.update(productRef, {
        stock: increment(-item.quantity),
        sold: increment(item.quantity),
      });
    }

    // 5. Update user's order stats
    transaction.update(userRef, {
      orderCount: increment(1),
      totalSpent: increment(totalAmount),
    });
  });

  // Attach a catch block to handle transaction failures, especially permission errors.
  // This is a non-blocking operation from the UI's perspective.
  transactionPromise.catch((e) => {
    console.error("Transaction failed: ", e);
    // Check if the error is likely a permission error. Firestore throws 'FirebaseError' for this.
    // We emit our custom, more detailed error for better debugging.
    if (e.code === 'permission-denied' || e.name === 'FirebaseError') {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: `users/${userId}/orders`, // The primary path being written to
          operation: 'create', // The core operation is creating an order
          requestResourceData: { 
            order: 'details withheld for brevity', 
            updates: `${items.length} products`,
            user_stats: 'increment' 
          },
        })
      );
    }
    // We don't re-throw here because the error is handled globally by the emitter.
  });

  return Promise.resolve();
}
