'use client';

import React from 'react';
import DashboardLayoutComponent from '@/components/dashboard/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>;
}
