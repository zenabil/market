'use client';

import React, { createContext, useReducer, useEffect, ReactNode, useMemo } from 'react';
import type { Product } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './language-provider';

type ComparisonState = {
  items: Product[];
};

type ComparisonAction =
  | { type: 'TOGGLE_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'CLEAR_COMPARISON' }
  | { type: 'SET_STATE'; payload: ComparisonState };

export interface ComparisonContextType extends ComparisonState {
  toggleComparison: (item: Product) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  MAX_COMPARISON_ITEMS: number;
}

export const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_COMPARISON_ITEMS = 4;

const comparisonReducer = (state: ComparisonState, action: ComparisonAction): ComparisonState => {
  switch (action.type) {
    case 'TOGGLE_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Item is already in the list, so remove it
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        };
      } else {
        // Item is not in the list, add it if there's space
        if (state.items.length >= MAX_COMPARISON_ITEMS) {
            // Do not add, state remains unchanged. The hook will show a toast.
            return state;
        }
        return {
          ...state,
          items: [...state.items, action.payload],
        };
      }
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id),
      };
    case 'CLEAR_COMPARISON':
      return { items: [] };
    case 'SET_STATE':
        return action.payload;
    default:
      return state;
  }
};

interface ComparisonProviderProps {
  children: ReactNode;
}

export const ComparisonProvider: React.FC<ComparisonProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(comparisonReducer, { items: [] });
  const { toast } = useToast();
  const { t } = useLanguage();
  
  useEffect(() => {
    try {
      const savedComparison = sessionStorage.getItem('comparison');
      if (savedComparison) {
        dispatch({ type: 'SET_STATE', payload: JSON.parse(savedComparison) });
      }
    } catch (error) {
      console.error("Failed to load comparison from sessionStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('comparison', JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save comparison to sessionStorage", error);
    }
  }, [state]);

  const toggleComparison = (item: Product) => {
    if (state.items.length >= MAX_COMPARISON_ITEMS && !state.items.find(i => i.id === item.id)) {
        toast({
            variant: 'destructive',
            title: t('compare.toast.limitReached.title'),
            description: t('compare.toast.limitReached.description').replace('{{count}}', MAX_COMPARISON_ITEMS.toString()),
        });
        return;
    }
    dispatch({ type: 'TOGGLE_ITEM', payload: item });
  };
  const removeFromComparison = (id: string) => dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  const clearComparison = () => dispatch({ type: 'CLEAR_COMPARISON' });

  const contextValue = useMemo(() => ({
    ...state,
    toggleComparison,
    removeFromComparison,
    clearComparison,
    MAX_COMPARISON_ITEMS,
  }), [state, toggleComparison, removeFromComparison, clearComparison]);

  return (
    <ComparisonContext.Provider value={contextValue}>
      {children}
    </ComparisonContext.Provider>
  );
};
