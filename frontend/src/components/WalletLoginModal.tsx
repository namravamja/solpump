"use client";

import { useEffect, useMemo, useState } from "react";

// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  try {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length, c.length);
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading cookie:', name, error);
    return null;
  }
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: { address: string; name: string; email: string; balance?: number }) => void;
};

export default function WalletLoginModal({ isOpen, onClose, onAuthenticated }: Props) {
  const [address, setAddress] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAddress("");
      setName("");
      setEmail("");
      setError(null);
      setConnecting(false);
      setSubmitting(false);
    } else {
      // Load saved data from cookies when modal opens
      const savedName = getCookie('user_name');
      const savedEmail = getCookie('user_email');
      const savedAddress = getCookie('user_address');
      
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      if (savedAddress) setAddress(savedAddress);
    }
  }, [isOpen]);

  const backendBase = useMemo(() => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000", []);

  const connectWallet = async () => {
    setError(null);
    setConnecting(true);
    try {
      // Minimal Phantom connect flow; if Phantom not found, simulate for dev
      const provider = (window as any)?.solana;
      if (provider?.isPhantom) {
        const resp = await provider.connect();
        setAddress(resp.publicKey?.toString?.() ?? "");
      } else {
        // Dev fallback: random address-like string
        const fake = "DevWallet-" + Math.random().toString(36).slice(2, 10);
        setAddress(fake);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  const submitProfile = async () => {
    setError(null);
    if (!address || !name || !email) {
      setError("Please complete all fields after connecting your wallet.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${backendBase}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, name, email })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const user = await res.json();
      
      // Save user data to cookies with 1 year expiration
      setCookie('user_name', name, 365);
      setCookie('user_email', email, 365);
      setCookie('user_address', address, 365);
      setCookie('user_balance', user.balance?.toString() || '1000', 365);
      
      onAuthenticated(user);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-md rounded-2xl glass p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Connect Wallet to Play</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-4 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {connecting ? "Connecting..." : address ? `Connected: ${address.slice(0, 6)}...` : "Connect Phantom Wallet"}
          </button>
          
          {address && (
            <div className="text-xs text-green-400 bg-green-900/20 border border-green-500/30 rounded p-2">
              ✅ Wallet connected successfully
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm text-gray-300">
              Name {name && getCookie('user_name') === name && <span className="text-green-400 text-xs">(saved)</span>}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your player name"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-300">
              Email {email && getCookie('user_email') === email && <span className="text-green-400 text-xs">(saved)</span>}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <button
            onClick={submitProfile}
            disabled={submitting || !address || !name || !email}
            className="w-full bg-green-600 hover:bg-green-500 border border-green-500 hover:border-green-400 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save & Play"}
          </button>
          
          {!address || !name || !email ? (
            <div className="text-xs text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded p-2">
              ⚠️ Please complete all fields to continue
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


