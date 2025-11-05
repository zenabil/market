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

interface PlaceOrderParams {
  shippingAddress: string;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
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
 */
export async function placeOrder(db: Firestore, userId: string, orderDetails: PlaceOrderParams): Promise<void> {
  const { shippingAddress, items, totalAmount, itemCount } = orderDetails;

  const userRef = doc(db, 'users', userId);
  const newOrderRef = doc(collection(db, `users/${userId}/orders`));

  try {
    await runTransaction(db, async (transaction) => {
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
      
      // 3. Create the new order
      transaction.set(newOrderRef, {
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
        itemCount,
      });

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
  } catch (e) {
    console.error("Transaction failed: ", e);
    // Re-throw the error to be caught by the calling function
    if (e instanceof Error) {
        throw e;
    }
    throw new Error("An unexpected error occurred while placing the order.");
  }
}
