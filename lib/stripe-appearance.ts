export const stripeAppearance = {
  theme: "stripe",
  inputs: "spaced",
  labels: "auto",
  variables: {
    colorPrimary: "#0570de",
    colorBackground: "#ffffff",
    colorText: "#30313d",
    colorDanger: "#df1b41",
    colorSuccess: "#0f6a4b",
    colorWarning: "#b26b00",
    colorTextSecondary: "#6b7280",
    colorTextPlaceholder: "#9ca3af",
    fontFamily:
      "Ideal Sans, Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    spacingUnit: "2px",
    borderRadius: "8px",
  },
  rules: {
    ".Tab": {
      border: "1px solid #E0E6EB",
      boxShadow:
        "0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02)",
    },
    ".Tab--selected": {
      borderColor: "#E0E6EB",
      boxShadow:
        "0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02), 0 0 0 2px #0570de",
    },
    ".Input": {
      border: "1px solid #E0E6EB",
      boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
    },
    ".Input--invalid": {
      boxShadow: "0 0 0 2px #df1b41",
    },
  },
} as const;
