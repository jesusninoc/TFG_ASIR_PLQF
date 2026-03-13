"use client";

import { Product } from "@/lib/types";
import { useStore } from "@/components/store-provider";

export function AddToCartButton({
  product,
  variant = "muted",
}: {
  product: Product;
  variant?: "muted" | "primary";
}) {
  const { addToCart } = useStore();
  const buttonClass = variant === "primary" ? "btn-primary" : "btn-accent";

  return (
    <button
      onClick={() => addToCart(product)}
      className={`${buttonClass} w-full px-4 py-2 text-sm`}
      type="button"
    >
      Añadir al carrito
    </button>
  );
}
