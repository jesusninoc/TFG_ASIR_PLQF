"use client";

import { CartItem, Product } from "@/lib/types";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { z } from "zod";

interface StoreContextValue {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  totalCents: number;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const STORAGE_KEY = "pc_selector_cart";
const MAX_QUANTITY = 99;

// Zod schema to validate cart data from localStorage
const cartItemSchema = z.object({
  product: z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    brand: z.string(),
    priceCents: z.number().int().positive(),
    image: z.string(),
    description: z.string(),
    type: z.string(),
  }).passthrough(),
  quantity: z.number().int().positive().max(MAX_QUANTITY),
});
const cartSchema = z.array(cartItemSchema).max(50);

export function StoreProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      const validated = cartSchema.safeParse(parsed);
      if (!validated.success) {
        window.localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return validated.data as CartItem[];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<StoreContextValue>(() => {
    const addToCart = (product: Product) => {
      setItems((currentItems) => {
        const existing = currentItems.find((item) => item.product.id === product.id);
        if (existing) {
          return currentItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) }
              : item,
          );
        }

        return [...currentItems, { product, quantity: 1 }];
      });
    };

    const removeFromCart = (productId: string) => {
      setItems((currentItems) =>
        currentItems.filter((item) => item.product.id !== productId),
      );
    };

    const clearCart = () => setItems([]);

    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const totalCents = items.reduce(
      (sum, item) => sum + item.quantity * item.product.priceCents,
      0,
    );

    return {
      items,
      addToCart,
      removeFromCart,
      clearCart,
      itemCount,
      totalCents,
    };
  }, [items]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore debe usarse dentro de StoreProvider");
  }

  return context;
}