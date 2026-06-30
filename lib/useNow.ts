"use client";
import { useEffect, useState } from "react";

/** Returns current Date ISO, refreshed every `intervalMs`. */
export function useNow(intervalMs = 1000): string {
  const [iso, setIso] = useState(() => new Date().toISOString());
  useEffect(() => {
    const t = setInterval(() => setIso(new Date().toISOString()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return iso;
}
