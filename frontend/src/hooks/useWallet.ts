"use client";

import { useState, useEffect, useCallback } from 'react';

export interface WalletInfo {
  address: string;
  name: string;
  email: string;
  balance: number;
}

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Check if wallet is already connected (from localStorage and cookies)
  useEffect(() => {
    console.log('useWallet: Starting wallet initialization check...');
    const checkSavedWallet = () => {
      console.log('useWallet: Checking for saved wallet data...');
      // First check localStorage
      const savedWallet = localStorage.getItem('wallet_connection');
      if (savedWallet) {
        try {
          const wallet = JSON.parse(savedWallet);
          setWalletInfo(wallet);
          setIsConnected(true);
          console.log('useWallet: Wallet auto-connected from localStorage:', wallet);
          return;
        } catch (error) {
          console.error('useWallet: Error parsing saved wallet:', error);
          localStorage.removeItem('wallet_connection');
        }
      }

      // If no localStorage, check cookies
      const getCookieValue = (name: string): string | null => {
        const value = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`))?.split('=')[1];
        return value ? decodeURIComponent(value) : null;
      };
      
      const savedName = getCookieValue('user_name');
      const savedEmail = getCookieValue('user_email');
      const savedAddress = getCookieValue('user_address');
      const savedBalance = getCookieValue('user_balance');
      
      if (savedName && savedEmail && savedAddress) {
        const walletData = {
          address: savedAddress,
          name: savedName,
          email: savedEmail,
          balance: savedBalance ? parseFloat(savedBalance) : 1000.0,
        };
        setWalletInfo(walletData);
        setIsConnected(true);
        // Save to localStorage for consistency
        localStorage.setItem('wallet_connection', JSON.stringify(walletData));
        console.log('useWallet: Wallet auto-connected from cookies:', walletData);
      } else {
        console.log('useWallet: No saved wallet data found in cookies');
      }
    };

    // Add a small delay to ensure cookies are loaded
    const timer = setTimeout(() => {
      checkSavedWallet();
      setInitialized(true);
      console.log('useWallet: Wallet initialization completed');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Connect wallet (demo mode for now)
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Simulate wallet connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for saved user data in cookies
      const savedName = document.cookie.split(';').find(c => c.trim().startsWith('user_name='))?.split('=')[1];
      const savedEmail = document.cookie.split(';').find(c => c.trim().startsWith('user_email='))?.split('=')[1];
      const savedAddress = document.cookie.split(';').find(c => c.trim().startsWith('user_address='))?.split('=')[1];
      const savedBalance = document.cookie.split(';').find(c => c.trim().startsWith('user_balance='))?.split('=')[1];
      
      let walletData: WalletInfo;
      
      if (savedName && savedEmail && savedAddress) {
        // Use saved data from cookies
        walletData = {
          address: savedAddress,
          name: savedName,
          email: savedEmail,
          balance: savedBalance ? parseFloat(savedBalance) : 1000.0,
        };
        console.log('Wallet connected with saved data:', walletData);
      } else {
        // Use demo data for new users
        walletData = {
          address: '0x1234567890abcdef1234567890abcdef12345678', // Fixed demo address
          name: 'DemoPlayer',
          email: 'demo@example.com',
          balance: 1000.0 // Demo balance
        };
        console.log('Wallet connected with demo data:', walletData);
      }

      setWalletInfo(walletData);
      setIsConnected(true);
      
      // Save to localStorage for compatibility
      localStorage.setItem('wallet_connection', JSON.stringify(walletData));
      
    } catch (error) {
      setConnectionError('Failed to connect wallet');
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletInfo(null);
    setIsConnected(false);
    localStorage.removeItem('wallet_connection');
    console.log('Wallet disconnected');
  }, []);

  // Update balance (for demo purposes)
  const updateBalance = useCallback((newBalance: number) => {
    if (walletInfo) {
      const updatedWallet = { ...walletInfo, balance: newBalance };
      setWalletInfo(updatedWallet);
      localStorage.setItem('wallet_connection', JSON.stringify(updatedWallet));
    }
  }, [walletInfo]);

  return {
    isConnected,
    walletInfo,
    isConnecting,
    connectionError,
    initialized,
    connectWallet,
    disconnectWallet,
    updateBalance,
  };
};
