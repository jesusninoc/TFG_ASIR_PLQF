"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/compatibility";
import { stripeAppearance } from "@/lib/stripe-appearance";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// ─── Design tokens ────────────────────────────────────────────────────────────

const SHIPPING_OPTIONS = [
  {
    id: "standard",
    label: "Envío estándar",
    description: "5–7 días laborables",
    priceCents: 0,
    badge: "Gratis",
  },
  {
    id: "express",
    label: "Envío express",
    description: "2–3 días laborables",
    priceCents: 499,
    badge: null,
  },
  {
    id: "overnight",
    label: "Entrega en 24 h",
    description: "Días laborables antes de las 14:00",
    priceCents: 999,
    badge: null,
  },
];

type Step = "shipping" | "delivery" | "payment";

const STEPS: { id: Step; label: string }[] = [
  { id: "shipping", label: "Envío" },
  { id: "delivery", label: "Entrega" },
  { id: "payment", label: "Pago" },
];

// ─── Shared field components ──────────────────────────────────────────────────

function Label({ children, htmlFor, required }: { children: React.ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-[var(--text-primary)]">
      {children}
      {required && <span className="ml-0.5 text-[var(--destructive)]">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-[var(--destructive)]">{message}</p>;
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

function InputField({ label, error, hint, id, required, className, ...props }: InputFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={className}>
      <Label htmlFor={fieldId} required={required}>{label}</Label>
      <input
        id={fieldId}
        required={required}
        className={[
          "input-base w-full px-3 py-2.5 text-sm",
          error ? "border-[var(--destructive)] focus:border-[var(--destructive)] focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]" : "",
        ].join(" ")}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
}

function SelectField({ label, error, options, id, required, className, ...props }: SelectFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className={className}>
      <Label htmlFor={fieldId} required={required}>{label}</Label>
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          className={[
            "input-base w-full appearance-none px-3 py-2.5 pr-9 text-sm",
            error ? "border-[var(--destructive)]" : "",
          ].join(" ")}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <span className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all",
                done  ? "bg-[var(--text-primary)] text-white" :
                active ? "border-2 border-[var(--text-primary)] bg-white text-[var(--text-primary)]" :
                         "border border-[var(--border-strong)] bg-white text-[var(--text-tertiary)]",
              ].join(" ")}>
                {done ? (
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : i + 1}
              </span>
              <span className={[
                "text-xs font-medium",
                active ? "text-[var(--text-primary)]" : done ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]",
              ].join(" ")}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={[
                "mx-3 h-px w-8 transition-colors",
                i < currentIdx ? "bg-[var(--text-primary)]" : "bg-[var(--border-strong)]",
              ].join(" ")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Shipping form ────────────────────────────────────────────────────────────

interface ShippingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

const COUNTRIES = [
  { value: "ES", label: "España" },
  { value: "PT", label: "Portugal" },
  { value: "FR", label: "Francia" },
  { value: "DE", label: "Alemania" },
  { value: "IT", label: "Italia" },
  { value: "GB", label: "Reino Unido" },
  { value: "US", label: "Estados Unidos" },
];

function ShippingForm({
  data,
  onChange,
  onNext,
}: {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingData, string>>>({});

  const set = (key: keyof ShippingData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({ ...data, [key]: e.target.value });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof ShippingData, string>> = {};
    if (!data.firstName.trim()) errs.firstName = "Obligatorio";
    if (!data.lastName.trim())  errs.lastName  = "Obligatorio";
    if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) errs.email = "Email inválido";
    if (!data.address.trim())   errs.address   = "Obligatorio";
    if (!data.city.trim())      errs.city      = "Obligatorio";
    if (!data.postalCode.trim()) errs.postalCode = "Obligatorio";
    return errs;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Nombre" required value={data.firstName} onChange={set("firstName")} error={errors.firstName} autoComplete="given-name" />
        <InputField label="Apellidos" required value={data.lastName} onChange={set("lastName")} error={errors.lastName} autoComplete="family-name" />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Email" required type="email" value={data.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <InputField label="Teléfono" type="tel" value={data.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" hint="Opcional" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--text-tertiary)]">Dirección de envío</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* Country */}
      <SelectField
        label="País"
        required
        value={data.country}
        onChange={set("country")}
        options={COUNTRIES}
        autoComplete="country"
      />

      {/* Address */}
      <InputField label="Dirección" required value={data.address} onChange={set("address")} error={errors.address} autoComplete="address-line1" placeholder="Calle, número, piso…" />
      <InputField label="Dirección (línea 2)" value={data.address2} onChange={set("address2")} autoComplete="address-line2" placeholder="Apartamento, bloque, escalera… (opcional)" />

      {/* City / Province / CP */}
      <div className="grid grid-cols-3 gap-4">
        <InputField label="Ciudad" required value={data.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" className="col-span-1" />
        <InputField label="Provincia" value={data.province} onChange={set("province")} autoComplete="address-level1" className="col-span-1" />
        <InputField label="Código postal" required value={data.postalCode} onChange={set("postalCode")} error={errors.postalCode} autoComplete="postal-code" className="col-span-1" />
      </div>

      <button type="submit" className="btn-primary mt-2 w-full py-3 text-sm">
        Continuar con la entrega →
      </button>
    </form>
  );
}

// ─── Delivery form ────────────────────────────────────────────────────────────

function DeliveryForm({
  selected,
  onSelect,
  onNext,
  onBack,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-3">
      {SHIPPING_OPTIONS.map((option) => {
        const active = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={[
              "group flex w-full items-start gap-4 rounded-xl border px-4 py-4 text-left transition-all",
              active
                ? "border-[var(--text-primary)] bg-[var(--bg-subtle)] shadow-sm"
                : "border-[var(--border-strong)] bg-white hover:border-[var(--text-primary)] hover:bg-[var(--bg-subtle)]",
            ].join(" ")}
          >
            {/* Radio */}
            <span className={[
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              active ? "border-[var(--text-primary)]" : "border-[var(--border-strong)] group-hover:border-[var(--text-secondary)]",
            ].join(" ")}>
              {active && <span className="h-2 w-2 rounded-full bg-[var(--text-primary)]" />}
            </span>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{option.label}</span>
                  {option.badge && (
                    <span className="rounded-full bg-[var(--success-subtle)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--success)]">
                      {option.badge}
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {option.priceCents === 0 ? "Gratis" : formatPrice(option.priceCents)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{option.description}</p>
            </div>
          </button>
        );
      })}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="btn-secondary flex-1 py-3 text-sm">
          ← Volver
        </button>
        <button type="button" onClick={onNext} className="btn-primary flex-1 py-3 text-sm">
          Continuar con el pago →
        </button>
      </div>
    </div>
  );
}

// ─── Stripe payment form ──────────────────────────────────────────────────────

function StripeCheckoutForm({
  totalCents,
  onPaid,
  onBack,
}: {
  totalCents: number;
  onPaid: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/checkout/success` },
      redirect: "if_required",
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error.message ?? "No se pudo completar el pago.");
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      onPaid();
      router.push(`/checkout/success?pi=${result.paymentIntent.id}`);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: { type: "accordion", defaultCollapsed: false, radios: true, spacedAccordionItems: true },
        }}
      />

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 4.5a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0V5.5zm-.75 6.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
          </svg>
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 1.5L2 4v4.5c0 3.3 2.5 6 6 6.5 3.5-.5 6-3.2 6-6.5V4L8 1.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Pago seguro cifrado con TLS · Procesado por Stripe
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-none px-5 py-3 text-sm">
          ← Volver
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="btn-primary flex-1 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Procesando…
            </span>
          ) : (
            `Pagar ${formatPrice(totalCents)}`
          )}
        </button>
      </div>
    </form>
  );
}

// ─── Order summary sidebar ────────────────────────────────────────────────────

function OrderSummary({
  shippingOption,
  subtotalCents,
}: {
  shippingOption: (typeof SHIPPING_OPTIONS)[number] | undefined;
  subtotalCents: number;
}) {
  const { items } = useStore();
  const shippingCents = shippingOption?.priceCents ?? 0;
  const totalCents = subtotalCents + shippingCents;

  return (
    <aside className="h-fit rounded-2xl border border-[var(--border)] bg-white">
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">Resumen del pedido</p>
      </div>

      {/* Items */}
      <ul className="divide-y divide-[var(--border)]">
        {items.map((item) => (
          <li key={item.product.id} className="flex items-start gap-3 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.product.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{item.product.brand} · ×{item.quantity}</p>
            </div>
            <p className="shrink-0 text-sm font-medium text-[var(--text-primary)]">
              {formatPrice(item.product.priceCents * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="px-5 py-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
          <span>Envío</span>
          <span>{shippingCents === 0 ? <span className="text-[var(--success)]">Gratis</span> : formatPrice(shippingCents)}</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold text-[var(--text-primary)]" style={{ borderTop: "1px solid var(--border)" }}>
          <span>Total</span>
          <span>{formatPrice(totalCents)}</span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-0" style={{ borderTop: "1px solid var(--border)" }}>
        {[
          { icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", label: "Garantía 3 años" },
          { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", label: "Devolución 30 días" },
          { icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", label: "Envío asegurado" },
        ].map((badge) => (
          <div key={badge.label} className="flex flex-col items-center gap-1.5 px-2 py-3" style={{ borderRight: "1px solid var(--border)" }}>
            <svg className="h-4 w-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d={badge.icon} />
            </svg>
            <span className="text-center text-[10px] leading-tight text-[var(--text-tertiary)]">{badge.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ─── Main checkout page ───────────────────────────────────────────────────────

type CheckoutMode = "loading" | "stripe" | "no-key" | "empty";

const EMPTY_SHIPPING: ShippingData = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", address2: "", city: "", province: "",
  postalCode: "", country: "ES",
};

export default function CheckoutPage() {
  const { items, totalCents, clearCart } = useStore();

  const [step, setStep]                   = useState<Step>("shipping");
  const [shippingData, setShippingData]   = useState<ShippingData>(EMPTY_SHIPPING);
  const [shippingOptionId, setShippingOptionId] = useState("standard");
  const [clientSecret, setClientSecret]   = useState<string | null>(null);
  const [mode, setMode]                   = useState<CheckoutMode>("loading");
  const [error, setError]                 = useState<string | null>(null);

  const shippingOption = SHIPPING_OPTIONS.find((o) => o.id === shippingOptionId);
  const shippingCents  = shippingOption?.priceCents ?? 0;
  const grandTotal     = totalCents + shippingCents;

  // Stable cart key — only rebuild PaymentIntent if cart contents change
  const cartKey = items.map((i) => `${i.product.id}:${i.quantity}`).sort().join(",");
  const bootstrappedKey = useRef<string | null>(null);

  useEffect(() => {
    if (items.length === 0) { setMode("empty"); return; }
    if (!publishableKey)    { setMode("no-key"); return; }
    // Only bootstrap when stepping to payment, and only once per cart+shipping combination
    if (step !== "payment") return;

    const key = `${cartKey}|${shippingCents}`;
    if (bootstrappedKey.current === key) return; // already initialized for this combination

    const bootstrap = async () => {
      try {
        setMode("loading");
        setError(null);
        bootstrappedKey.current = key;
        const res = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
            shippingCents,
          }),
        });
        const payload = await res.json() as { clientSecret?: string; error?: string };
        if (!res.ok || payload.error) throw new Error(payload.error ?? "Error al preparar el pago.");
        if (payload.clientSecret) { setClientSecret(payload.clientSecret); setMode("stripe"); return; }
        throw new Error("Respuesta inesperada del servidor.");
      } catch (err) {
        bootstrappedKey.current = null; // allow retry
        setError(err instanceof Error ? err.message : "Error al preparar el checkout.");
        setMode("no-key");
      }
    };
    bootstrap();
  }, [step, cartKey, shippingCents, items, publishableKey]);

  // ── Shipping address summary pill ──
  const shippingAddressSummary = shippingData.address
    ? `${shippingData.address}, ${shippingData.city} ${shippingData.postalCode}`
    : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

        {/* ── Left: multi-step form ─────────────────────────────── */}
        <div className="space-y-0">

          {/* Breadcrumb steps */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">Finalizar pedido</h1>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                {step === "shipping" && "Introduce tus datos de envío"}
                {step === "delivery" && "Selecciona el método de entrega"}
                {step === "payment"  && "Introduce los datos de pago"}
              </p>
            </div>
            <StepIndicator current={step} />
          </div>

          {/* ── Shipping address summary (shown on delivery/payment steps) ── */}
          {step !== "shipping" && shippingAddressSummary && (
            <div
              className="mb-5 flex items-start justify-between gap-4 rounded-xl px-4 py-3.5"
              style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)" }}
            >
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    {shippingData.firstName} {shippingData.lastName}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{shippingAddressSummary}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep("shipping")}
                className="shrink-0 text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Editar
              </button>
            </div>
          )}

          {/* ── Delivery option summary (shown on payment step) ── */}
          {step === "payment" && shippingOption && (
            <div
              className="mb-5 flex items-center justify-between gap-4 rounded-xl px-4 py-3.5"
              style={{ border: "1px solid var(--border)", background: "var(--bg-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">{shippingOption.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{shippingOption.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {shippingCents === 0 ? "Gratis" : formatPrice(shippingCents)}
                </span>
                <button
                  type="button"
                  onClick={() => setStep("delivery")}
                  className="text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  Cambiar
                </button>
              </div>
            </div>
          )}

          {/* ── Panel ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-white">
            <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                {step === "shipping" && "Datos de envío"}
                {step === "delivery" && "Método de entrega"}
                {step === "payment"  && "Datos de pago"}
              </p>
            </div>

            <div className="px-6 py-6">
              {/* ── Empty cart ── */}
              {mode === "empty" && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                  Tu carrito está vacío.{" "}
                  <a href="/shop" className="font-medium text-[var(--text-primary)] underline">Ir a la tienda</a>
                </div>
              )}

              {/* ── No Stripe key ── */}
              {mode === "no-key" && step === "payment" && !error && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  El sistema de pagos no está configurado correctamente.
                </div>
              )}

              {/* ── General error ── */}
              {error && step === "payment" && (
                <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
              )}

              {/* ── Step content ── */}
              {mode !== "empty" && (
                <>
                  {step === "shipping" && (
                    <ShippingForm
                      data={shippingData}
                      onChange={setShippingData}
                      onNext={() => setStep("delivery")}
                    />
                  )}

                  {step === "delivery" && (
                    <DeliveryForm
                      selected={shippingOptionId}
                      onSelect={setShippingOptionId}
                      onNext={() => setStep("payment")}
                      onBack={() => setStep("shipping")}
                    />
                  )}

                  {step === "payment" && (
                    <>
                      {mode === "loading" && (
                        <div className="flex items-center gap-2 py-6 text-sm text-[var(--text-secondary)]">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          Preparando formulario de pago…
                        </div>
                      )}

                      {mode === "stripe" && clientSecret && stripePromise && (
                        <Elements
                          stripe={stripePromise}
                          options={{
                            clientSecret,
                            appearance: {
                              ...stripeAppearance,
                              variables: {
                                ...stripeAppearance.variables,
                                colorPrimary: "#111110",
                                fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
                                borderRadius: "8px",
                                colorBackground: "#ffffff",
                                colorText: "#111110",
                                colorTextSecondary: "#6B7280",
                                colorTextPlaceholder: "#9CA3AF",
                                spacingUnit: "3px",
                              },
                              rules: {
                                ".Input": { border: "1px solid rgba(0,0,0,0.14)", boxShadow: "none" },
                                ".Input:focus": { border: "1px solid #111110", boxShadow: "0 0 0 3px rgba(17,17,16,0.08)" },
                                ".Tab": { border: "1px solid rgba(0,0,0,0.08)", boxShadow: "none" },
                                ".Tab--selected": { border: "1px solid #111110", boxShadow: "0 0 0 2px #111110" },
                                ".Label": { color: "#111110", fontSize: "12px", fontWeight: "500" },
                              },
                            },
                          }}
                        >
                          <StripeCheckoutForm
                            totalCents={grandTotal}
                            onPaid={clearCart}
                            onBack={() => setStep("delivery")}
                          />
                        </Elements>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: order summary ──────────────────────────────── */}
        <div className="lg:sticky lg:top-6">
          <OrderSummary
            shippingOption={shippingOption}
            subtotalCents={totalCents}
          />
        </div>
      </div>
    </main>
  );
}
