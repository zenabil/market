
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
  phone: string;
  items: CartItem[];
  totalAmount: number;
}

/**
 * Places an order in a transaction to ensure atomicity.
 * This function will:
 * 1. Create a new order document for the user.
 * 2. For each item in the order, decrement the product's stock and increment its 'sold' count.
 * 3. Update the user's total order count and total spent amount.
 * 4. Award loyalty points based on the total amount.
 * 5. Update user's phone number if provided.
 *
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} userId - The ID of the user placing the order.
 * @param {PlaceOrderParams} orderDetails - The details of the order.
 * @returns {Promise<void>} A promise that resolves when the transaction completes successfully, or rejects on failure.
 */
export function placeOrder(db: Firestore, userId: string, orderDetails: PlaceOrderParams): Promise<void> {
  const { shippingAddress, phone, items, totalAmount } = orderDetails;

  const userRef = doc(db, 'users', userId);
  const newOrderRef = doc(collection(db, `users/${userId}/orders`));
  const loyaltyPointsEarned = Math.floor(totalAmount / 100);

  // The transaction promise is now returned to the caller.
  return runTransaction(db, async (transaction) => {
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
        throw new Error(`Product ${item.name} not found.`);
      }
      const currentStock = productDoc.data().stock;
      if (currentStock < item.quantity) {
        throw new Error(`Not enough stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
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

    // 5. Update user's order stats, loyalty points, and phone number
    const userUpdateData: any = {
      orderCount: increment(1),
      totalSpent: increment(totalAmount),
      loyaltyPoints: increment(loyaltyPointsEarned),
    };

    if (phone) {
      userUpdateData.phone = phone;
    }
    
    transaction.update(userRef, userUpdateData);
  }).catch((e) => {
    // Check if the error is likely a permission error.
    if (e.code === 'permission-denied' || (e.name === 'FirebaseError' && e.message.includes('permission'))) {
      const permissionError = new FirestorePermissionError({
        path: `users/${userId}/orders`, // Primary path
        operation: 'create',
        requestResourceData: { order: 'details withheld' },
      });
      errorEmitter.emit('permission-error', permissionError);
    }
    // Re-throw the original error as a standard Error object to ensure a message is available
    throw new Error(e.message || 'An unknown error occurred during the transaction.');
  });
}
