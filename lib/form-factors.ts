import { FormFactor } from "@/lib/types";

export const FORM_FACTOR_DIMENSIONS_MM: Record<
  FormFactor,
  { width: number; height: number }
> = {
  "Mini-ITX": { width: 170, height: 170 },
  mATX: { width: 244, height: 244 },
  ATX: { width: 305, height: 244 },
  "E-ATX": { width: 305, height: 264 },
  "XL-ATX": { width: 345, height: 305 },
};

export function getFormFactorLabel(formFactor: FormFactor) {
  const size = FORM_FACTOR_DIMENSIONS_MM[formFactor];
  return `${formFactor} (${size.width}×${size.height} mm)`;
}
