'use client';

import { useContext } from 'react';
import { ComparisonContext, type ComparisonContextType } from '@/contexts/comparison-provider';

export const useComparison = (): ComparisonContextType => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
