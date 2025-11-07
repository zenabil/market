import { Firestore, collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CreateNotificationParams {
  message: string;
  link: string;
}

/**
 * Creates a notification for a specific user.
 * This is intended to be called from a secure environment (like an admin dashboard)
 * as it requires permission to write to another user's subcollection.
 *
 * @param {Firestore} db - The Firestore database instance.
 * @param {string} userId - The ID of the user to notify.
 * @param {CreateNotificationParams} notificationDetails - The details of the notification.
 * @returns {Promise<void>} A promise that resolves when the notification is created.
 */
export async function createNotification(
  db: Firestore,
  userId: string,
  notificationDetails: CreateNotificationParams
): Promise<void> {
  if (!userId) {
    console.error("User ID is required to create a notification.");
    return;
  }

  const notificationsCollection = collection(db, `users/${userId}/notifications`);
  
  const notificationData = {
    userId,
    ...notificationDetails,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  addDoc(notificationsCollection, notificationData).catch(error => {
    if ((error as any).code === 'permission-denied') {
      const permissionError = new FirestorePermissionError({
        path: notificationsCollection.path,
        operation: 'create',
        requestResourceData: notificationData,
      });
      errorEmitter.emit('permission-error', permissionError);
    } else {
        console.error("Failed to create notification:", error);
    }
  });
}
