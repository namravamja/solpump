"use client";

import { useCallback, useEffect } from 'react';
import { useSimpleStore, walletActions, userActions, store, type WalletInfo } from '../store/simpleStore';

export const useWalletSimple = () => {
  const state = useSimpleStore();
  const { isConnected, walletInfo, isConnecting, connectionError, initialized } = state.wallet;

  // Initialize wallet from cookies only (no localStorage)
  useEffect(() => {
    const initializeWallet = () => {
      console.log('useWalletSimple: Starting wallet initialization...');
      
      // Check cookies only
      const getCookieValue = (name: string): string | null => {
        try {
          const value = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`))?.split('=')[1];
          return value ? decodeURIComponent(value) : null;
        } catch (error) {
          console.error('Error reading cookie:', name, error);
          return null;
        }
      };
      
      const savedName = getCookieValue('user_name');
      const savedEmail = getCookieValue('user_email');
      const savedAddress = getCookieValue('user_address');
      const savedBalance = getCookieValue('user_balance');
      
      if (savedName && savedEmail && savedAddress) {
        const walletData: WalletInfo = {
          address: savedAddress,
          name: savedName,
          email: savedEmail,
          balance: savedBalance ? parseFloat(savedBalance) : 1000.0,
        };
        walletActions.autoConnectWallet(walletData);
        console.log('useWalletSimple: Wallet auto-connected from cookies:', walletData);
      } else {
        console.log('useWalletSimple: No saved wallet data found');
        walletActions.setInitialized(true);
      }
    };

    // Add a small delay to ensure cookies are loaded
    const timer = setTimeout(initializeWallet, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch balance from database
  const fetchBalanceFromDB = useCallback(async (address: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/${encodeURIComponent(address)}`);
      if (response.ok) {
        const userData = await response.json();
        return userData.balance || 1000.0;
      }
    } catch (error) {
      console.error('Failed to fetch balance from database:', error);
    }
    return 1000.0; // Default balance
  }, []);

  // Save wallet data to cookies
  const saveWalletToCookies = useCallback((walletData: WalletInfo) => {
    const setCookie = (name: string, value: string) => {
      document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`;
    };
    setCookie('user_name', walletData.name);
    setCookie('user_email', walletData.email);
    setCookie('user_address', walletData.address);
    setCookie('user_balance', walletData.balance.toString());
    console.log('useWalletSimple: Wallet data saved to cookies');
  }, []);

  // Connect wallet from saved cookies only (no demo fallback)
  const connectWallet = useCallback(async () => {
    walletActions.setConnecting(true);
    walletActions.setConnectionError(null);

    try {
      const getCookieValue = (name: string): string | null => {
        try {
          const value = document.cookie.split(';').find(c => c.trim().startsWith(`${name}=`))?.split('=')[1];
          return value ? decodeURIComponent(value) : null;
        } catch (error) {
          console.error('Error reading cookie:', name, error);
          return null;
        }
      };

      const savedName = getCookieValue('user_name');
      const savedEmail = getCookieValue('user_email');
      const savedAddress = getCookieValue('user_address');

      if (!savedName || !savedEmail || !savedAddress) {
        walletActions.setConnectionError('Please enter name and email to connect wallet');
        walletActions.setConnecting(false);
        return;
      }

      const currentBalance = await fetchBalanceFromDB(savedAddress);
      const walletData: WalletInfo = {
        address: savedAddress,
        name: savedName,
        email: savedEmail,
        balance: currentBalance,
      };

      walletActions.connectWallet(walletData);
      userActions.setUser({
        address: walletData.address,
        name: walletData.name,
        email: walletData.email,
        balance: walletData.balance,
      });
      saveWalletToCookies(walletData);
    } catch (error) {
      walletActions.setConnectionError('Failed to connect wallet');
      console.error('useWalletSimple: Wallet connection error:', error);
    } finally {
      walletActions.setConnecting(false);
    }
  }, [fetchBalanceFromDB, saveWalletToCookies]);

  // Explicit connect with provided profile (address, name, email)
  const connectWithProfile = useCallback(async (info: { address: string; name: string; email: string }) => {
    walletActions.setConnecting(true);
    walletActions.setConnectionError(null);

    try {
      // Ensure user exists and get latest data from backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: info.address, name: info.name, email: info.email })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as any));
        throw new Error(body?.error || `Failed to save user (${res.status})`);
      }
      const user = await res.json();

      const walletData: WalletInfo = {
        address: user.address,
        name: user.name,
        email: user.email,
        balance: typeof user.balance === 'number' ? user.balance : await fetchBalanceFromDB(user.address)
      };

      walletActions.connectWallet(walletData);
      userActions.setUser({
        address: walletData.address,
        name: walletData.name,
        email: walletData.email,
        balance: walletData.balance,
      });
      saveWalletToCookies(walletData);
    } catch (error) {
      walletActions.setConnectionError('Failed to connect wallet');
      console.error('useWalletSimple: connectWithProfile error:', error);
    } finally {
      walletActions.setConnecting(false);
    }
  }, [fetchBalanceFromDB, saveWalletToCookies]);

  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    walletActions.disconnectWallet();
    // Clear cookies only
    document.cookie = 'user_name=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    document.cookie = 'user_email=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    document.cookie = 'user_address=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    document.cookie = 'user_balance=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
    console.log('useWalletSimple: Wallet disconnected');
  }, []);

  // (moved saveWalletToCookies above so it is defined before use)

  // Update balance function
  const updateBalance = useCallback(async (newBalance: number) => {
    const currentState = store.getState();
    const currentAddress = currentState.wallet.walletInfo?.address;
    
    if (!currentAddress) {
      console.error('No wallet address available for balance update');
      return;
    }
    
    try {
      console.log('Updating balance in database:', { address: currentAddress, newBalance });
      
      // Update balance in database
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/${encodeURIComponent(currentAddress)}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balance: newBalance }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        console.log('Balance updated successfully in database:', updatedUser);
        
        // Update local state
        walletActions.updateBalance(newBalance);
        // Update cookies with proper encoding and expiration
        document.cookie = `user_balance=${encodeURIComponent(newBalance.toString())};path=/;max-age=31536000;SameSite=Lax`;
        console.log('Balance updated in local state and cookies:', newBalance);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to update balance in database:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }, []);

  return {
    isConnected,
    walletInfo,
    isConnecting,
    connectionError,
    initialized,
    connectWallet,
    connectWithProfile,
    disconnectWallet,
    updateBalance,
    saveWalletToCookies,
  };
};
