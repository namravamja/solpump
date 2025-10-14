"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type AppUser = { address: string; name: string; email: string; balance?: number } | null;

type Ctx = {
  user: AppUser;
  setUser: (u: AppUser) => void;
};

const UserContext = createContext<Ctx | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}


