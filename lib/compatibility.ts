import { CompatibilityCheck, CompatibilityReport, PcBuildSelection } from "@/lib/types";
import { getFormFactorLabel } from "@/lib/form-factors";

export function evaluateBuildCompatibility(
  selection: PcBuildSelection,
): CompatibilityReport {
  const checks: CompatibilityCheck[] = [];

  if (selection.cpu && selection.motherboard) {
    const matchesSocket = selection.cpu.socket === selection.motherboard.socket;
    checks.push({
      label: "Socket CPU / Placa",
      ok: matchesSocket,
      detail: matchesSocket
        ? `Ambos usan ${selection.cpu.socket}`
        : `CPU ${selection.cpu.socket} vs placa ${selection.motherboard.socket}`,
    });
  }

  if (selection.memory && selection.motherboard) {
    const matchesMemoryType =
      selection.memory.memoryType === selection.motherboard.memoryType;
    checks.push({
      label: "Memoria compatible",
      ok: matchesMemoryType,
      detail: matchesMemoryType
        ? `Ambas usan ${selection.memory.memoryType}`
        : `RAM ${selection.memory.memoryType} vs placa ${selection.motherboard.memoryType}`,
    });
  }

  if (selection.storage && selection.motherboard) {
    const hasRequiredInterface =
      selection.storage.interface === "M2_NVME"
        ? selection.motherboard.m2Slots > 0
        : selection.motherboard.sataPorts > 0;
    checks.push({
      label: "Interfaz de almacenamiento",
      ok: hasRequiredInterface,
      detail: hasRequiredInterface
        ? `La placa soporta ${selection.storage.interface}`
        : `La placa no soporta ${selection.storage.interface}`,
    });
  }

  if (selection.case && selection.motherboard) {
    const isFormFactorCompatible = selection.case.supportedFormFactors.includes(
      selection.motherboard.formFactor,
    );
    const boardLabel = getFormFactorLabel(selection.motherboard.formFactor);
    checks.push({
      label: "Formato placa / torre",
      ok: isFormFactorCompatible,
      detail: isFormFactorCompatible
        ? `La torre soporta ${boardLabel}`
        : `La torre no soporta ${boardLabel}`,
    });
  }

  const estimatedPowerWatts =
    (selection.cpu?.tdpWatts ?? 0) +
    (selection.gpu?.tdpWatts ?? 0) +
    (selection.motherboard ? 60 : 0) +
    (selection.memory ? 10 : 0) +
    (selection.storage ? 10 : 0);

  if (selection.psu) {
    const requiredWithMargin = Math.ceil(estimatedPowerWatts * 1.3);
    const enoughPower = selection.psu.wattage >= requiredWithMargin;
    checks.push({
      label: "Potencia de fuente",
      ok: enoughPower,
      detail: enoughPower
        ? `${selection.psu.wattage}W para consumo estimado ${estimatedPowerWatts}W`
        : `Recomendado ${requiredWithMargin}W y tienes ${selection.psu.wattage}W`,
    });
  }

  const totalPriceCents = Object.values(selection).reduce(
    (sum, product) => sum + (product?.priceCents ?? 0),
    0,
  );

  const isCompatible = checks.length === 0 || checks.every((check) => check.ok);

  return {
    checks,
    totalPriceCents,
    estimatedPowerWatts,
    isCompatible,
  };
}

export function formatPrice(priceCents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(priceCents / 100);
}