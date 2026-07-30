"use client";

import { useState, useEffect } from "react";

/**
 * This component safely renders a locale-formatted date on the client
 * to prevent hydration mismatches.
 */
export default function ClientDate({ date }: { date: string | Date }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{new Date(date).toLocaleDateString()}</>;
}
