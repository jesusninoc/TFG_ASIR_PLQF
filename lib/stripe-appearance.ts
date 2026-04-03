import type { Appearance } from "@stripe/stripe-js";

/**
 * Tema base de Stripe — se sobreescribe parcialmente en checkout/page.tsx
 * para el paso de pago con las variables del sistema de diseño del proyecto.
 */
export const stripeAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#111110",
    colorBackground: "#ffffff",
    colorText: "#111110",
    colorDanger: "#DC2626",
    colorSuccess: "#16A34A",
    colorWarning: "#D97706",
    colorTextSecondary: "#6B7280",
    colorTextPlaceholder: "#9CA3AF",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
    spacingUnit: "3px",
    borderRadius: "8px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(0,0,0,0.14)",
      boxShadow: "none",
      fontSize: "14px",
    },
    ".Input:focus": {
      border: "1px solid #111110",
      boxShadow: "0 0 0 3px rgba(17,17,16,0.08)",
    },
    ".Input--invalid": {
      border: "1px solid #DC2626",
      boxShadow: "0 0 0 3px rgba(220,38,38,0.08)",
    },
    ".Tab": {
      border: "1px solid rgba(0,0,0,0.08)",
      boxShadow: "none",
      color: "#6B7280",
    },
    ".Tab--selected": {
      border: "1px solid #111110",
      boxShadow: "0 0 0 2px #111110",
      color: "#111110",
    },
    ".Tab:hover": {
      border: "1px solid rgba(0,0,0,0.2)",
      color: "#111110",
    },
    ".Label": {
      color: "#111110",
      fontSize: "12px",
      fontWeight: "500",
    },
    ".Error": {
      color: "#DC2626",
      fontSize: "12px",
    },
  },
};
