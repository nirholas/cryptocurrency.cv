'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
export interface Transaction {
  id: string;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  amount: number;
  pricePerCoin: number;
  totalValue: number;
  date: string;
  notes?: string;
  exchange?: string;
}

export interface Holding {
  coinId: string;
  coinSymbol: string;
  coinName: string;
  amount: number;
  averageBuyPrice: number;
  totalCost: number;
  transactions: Transaction[];
}

export interface PortfolioState {
  holdings: Holding[];
  transactions: Transaction[];
  createdAt: string;
  updatedAt: string;
}

interface PortfolioContextType {
  holdings: Holding[];
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => { success: boolean; error?: string };
  removeTransaction: (id: string) => void;
  getHolding: (coinId: string) => Holding | undefined;
  clearPortfolio: () => void;
  exportPortfolio: () => string;
  importPortfolio: (data: string) => { success: boolean; error?: string };
  isLoaded: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
}

const STORAGE_KEY = 'crypto-portfolio-v2';

interface PortfolioProviderProps {
  children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const [state, setState] = useState<PortfolioState>({
    holdings: [],
    transactions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        console.error('Failed to save portfolio');
      }
    }
  }, [state, isLoaded]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const recalculateHoldings = useCallback((transactions: Transaction[]): Holding[] => {
    const holdingsMap = new Map<string, Holding>();

    // Sort transactions by date
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const tx of sortedTx) {
      let holding = holdingsMap.get(tx.coinId);

      if (!holding) {
        holding = {
          coinId: tx.coinId,
          coinSymbol: tx.coinSymbol,
          coinName: tx.coinName,
          amount: 0,
          averageBuyPrice: 0,
          totalCost: 0,
          transactions: [],
        };
        holdingsMap.set(tx.coinId, holding);
      }

      holding.transactions.push(tx);

      switch (tx.type) {
        case 'buy':
        case 'transfer_in':
          // Calculate new average buy price
          const newTotalCost = holding.totalCost + tx.totalValue;
          const newAmount = holding.amount + tx.amount;
          holding.averageBuyPrice = newAmount > 0 ? newTotalCost / newAmount : 0;
          holding.amount = newAmount;
          holding.totalCost = newTotalCost;
          break;

        case 'sell':
        case 'transfer_out':
          holding.amount = Math.max(0, holding.amount - tx.amount);
          // Reduce total cost proportionally
          if (holding.amount > 0) {
            holding.totalCost = holding.averageBuyPrice * holding.amount;
          } else {
            holding.totalCost = 0;
            holding.averageBuyPrice = 0;
          }
          break;
      }
    }

    // Filter out holdings with zero or negative amounts
    return Array.from(holdingsMap.values()).filter(h => h.amount > 0);
  }, []);

  const addTransaction = useCallback((txData: Omit<Transaction, 'id'>) => {
    // Validation
    if (txData.amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }
    if (txData.pricePerCoin < 0) {
      return { success: false, error: 'Price cannot be negative' };
    }

    // Check if selling more than owned
    if (txData.type === 'sell' || txData.type === 'transfer_out') {
      const holding = state.holdings.find(h => h.coinId === txData.coinId);
      if (!holding || holding.amount < txData.amount) {
        return { success: false, error: `Insufficient ${txData.coinSymbol.toUpperCase()} balance` };
      }
    }

    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setState(prev => {
      const newTransactions = [...prev.transactions, newTx];
      const newHoldings = recalculateHoldings(newTransactions);
      return {
        ...prev,
        transactions: newTransactions,
        holdings: newHoldings,
        updatedAt: new Date().toISOString(),
      };
    });

    return { success: true };
  }, [state.holdings, recalculateHoldings]);

  const removeTransaction = useCallback((id: string) => {
    setState(prev => {
      const newTransactions = prev.transactions.filter(tx => tx.id !== id);
      const newHoldings = recalculateHoldings(newTransactions);
      return {
        ...prev,
        transactions: newTransactions,
        holdings: newHoldings,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [recalculateHoldings]);

  const getHolding = useCallback((coinId: string) => {
    return state.holdings.find(h => h.coinId === coinId);
  }, [state.holdings]);

  const clearPortfolio = useCallback(() => {
    setState({
      holdings: [],
      transactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const exportPortfolio = useCallback(() => {
    return JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      data: state,
    }, null, 2);
  }, [state]);

  const importPortfolio = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.version !== 2 || !parsed.data) {
        return { success: false, error: 'Invalid portfolio format' };
      }
      setState({
        ...parsed.data,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid JSON format' };
    }
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        holdings: state.holdings,
        transactions: state.transactions,
        addTransaction,
        removeTransaction,
        getHolding,
        clearPortfolio,
        exportPortfolio,
        importPortfolio,
        isLoaded,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export default PortfolioProvider;
