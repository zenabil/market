'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Custom hook to determine the user's role (admin or not).
 * It checks for the existence of a document in the `/roles_admin/{userId}` collection.
 * @returns An object containing `isAdmin` (boolean) and `isRoleLoading` (boolean).
 */
export function useUserRole() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  // Create a memoized reference to the user's document in the admin roles collection.
  const adminRoleRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  // Use the useDoc hook to listen for changes to the admin role document.
  const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRoleRef);
  
  // The overall loading state depends on both the initial authentication check
  // and the fetching of the admin role document.
  const isRoleLoading = isAuthLoading || (user && isAdminDocLoading);
  
  // The user is an admin if they are logged in and their admin role document exists.
  const isAdmin = !!user && !!adminDoc;

  return { isAdmin, isRoleLoading };
}
