'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/firebase';

/**
 * Custom hook to determine the user's role (admin or not).
 * It memoizes the admin status to avoid re-calculating on every render.
 * @returns An object containing `isAdmin` (boolean) and `isRoleLoading` (boolean).
 */
export function useUserRole() {
  const { user, isUserLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isRoleLoading, setIsRoleLoading] = useState<boolean>(true);

  useEffect(() => {
    // We start loading the role status.
    setIsRoleLoading(true);

    const checkAdminStatus = async () => {
      if (user) {
        try {
          // The admin claim is part of the ID token.
          const idTokenResult = await user.getIdTokenResult();
          // The `admin` claim is a custom claim set on the user's token.
          const isAdminClaim = !!idTokenResult.claims.admin;
          setIsAdmin(isAdminClaim);
        } catch (error) {
          console.error("Error fetching user token for admin check:", error);
          setIsAdmin(false);
        }
      } else {
        // If there's no authenticated user, they are not an admin.
        setIsAdmin(false);
      }
      // Once the check is complete (or if there's no user), we are done loading.
      setIsRoleLoading(false);
    };

    // We only run the check if the initial user loading is finished.
    if (!isUserLoading) {
      checkAdminStatus();
    }
  }, [user, isUserLoading]);

  return { isAdmin, isRoleLoading };
}
