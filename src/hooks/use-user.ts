"use client";

import { useUserContext } from "@/components/providers/user-provider";

export function useUser() {
  const context = useUserContext();
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
