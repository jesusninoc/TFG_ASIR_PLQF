"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Brain, ShoppingCart } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/compatibility";
import { TOGGLE_AI_ASSISTANT_EVENT, TOGGLE_CART_EVENT } from "@/lib/assistant/assistant-events";

export function SiteHeader() {
  const { items, itemCount, removeFromCart, totalCents } = useStore();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Listen for cart toggle event
  useEffect(() => {
    const handleToggleCart = () => {
      setOpen((prev) => !prev);
    };
    window.addEventListener(TOGGLE_CART_EVENT, handleToggleCart);
    return () => {
      window.removeEventListener(TOGGLE_CART_EVENT, handleToggleCart);
    };
  }, []);

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/shop", label: "Tienda" },
    { href: "/builder", label: "Builder" },
  ];

  const toggleAiAssistant = () => {
    window.dispatchEvent(new Event(TOGGLE_AI_ASSISTANT_EVENT));
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-h-11 items-center gap-2 rounded-full pr-2">
            <img src="/logo.png" alt="Logo" className="h-24" />
          </Link>

          <nav className="hidden items-center p-1 sm:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    active
                      ? " font-semibold"
                      : "font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">

            <button
              onClick={() => setOpen(true)}
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
              aria-label={`Abrir carrito${itemCount > 0 ? `, ${itemCount} artículos` : ""}`}
              title="Carrito"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.9} />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-semibold text-white">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleAiAssistant}
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)]"
              aria-label="Abrir o cerrar asistente de IA"
              title="Asistente de IA"
            >
              <Brain className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </header>

      <Dialog open={open} onClose={setOpen} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ease-in-out data-closed:opacity-0"
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-sm transform transition duration-300 ease-in-out data-closed:translate-x-full"
              >
                <div className="flex h-full flex-col bg-[var(--bg-base)]" style={{ borderLeft: "1px solid var(--border)" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between bg-[var(--bg-card)] px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <DialogTitle className="text-lg font-semibold text-[var(--text-primary)]">
                      Carrito · {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-full p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Items */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {items.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                        <ShoppingCart className="h-10 w-10 text-[var(--text-tertiary)]" strokeWidth={1.6} />
                        <p className="text-sm text-[var(--text-secondary)]">El carrito está vacío.</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li key={item.product.id} className="flex items-start gap-3 bg-[var(--bg-card)] p-3 border-b">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--bg-subtle)]">
                              <Image
                                alt={item.product.name}
                                src={item.product.image}
                                width={56}
                                height={56}
                                className="h-full w-full object-contain p-1.5"
                              />
                            </div>

                            <div className="flex flex-1 flex-col gap-1 min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.product.name}</p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {item.product.brand} · {item.product.type}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                  {formatPrice(item.product.priceCents * item.quantity)}
                                </p>
                                <button
                                  type="button"
                                  className="text-xs text-[var(--destructive)] transition-opacity hover:opacity-70"
                                  onClick={() => removeFromCart(item.product.id)}
                                >
                                  Quitar
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Footer */}
                  {items.length > 0 && (
                    <div className="bg-[var(--bg-card)] px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Subtotal</span>
                        <span className="font-semibold text-[var(--text-primary)]">{formatPrice(totalCents)}</span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Impuestos y envío calculados en checkout.
                      </p>
                      <Link
                        href="/checkout"
                        onClick={() => setOpen(false)}
                        className="btn-stripe flex min-h-11 w-full items-center justify-center px-4 py-2.5 text-sm"
                      >
                        Ir al checkout
                      </Link>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="w-full text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Seguir comprando &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
