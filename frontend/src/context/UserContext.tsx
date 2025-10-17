// src/context/UserContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface UserContextType {
  name: string;
  email: string;
  role: string;
  profile: string | null;
  bio: string;
  setUser: (data: Partial<UserContextType>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserContextType>({
    name: "",
    email: "",
    role: "",
    profile: null,
    bio: "",
    setUser: () => {}, // temporary placeholder; will override in useEffect
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("name") || "";
      const email = localStorage.getItem("email") || "";
      const role = localStorage.getItem("role") || "";
      const profile = localStorage.getItem("profile") || null;
      const bio = localStorage.getItem("bio") || "";

      setUserState({
        name,
        email,
        role,
        profile,
        bio,
        setUser: (data: Partial<UserContextType>) => {
          setUserState((prev) => {
            const updated = { ...prev, ...data };
            if (data.name !== undefined) localStorage.setItem("name", data.name);
            if (data.bio !== undefined) localStorage.setItem("bio", data.bio);
            if (data.profile !== undefined)
              localStorage.setItem("profile", data.profile || ""); // fallback to empty string
            return updated;
          });
        },
      });
    }
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
