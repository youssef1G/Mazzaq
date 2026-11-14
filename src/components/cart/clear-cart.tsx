"use client";

import { useEffect } from "react";
import { useCart } from "./cart-provider";

export function ClearCart() {
  const { clearCart, hydrated } = useCart();

  useEffect(() => {
    if (hydrated) clearCart();
  }, [clearCart, hydrated]);

  return null;
}
