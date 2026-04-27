const requiredServerEnv = [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "NIM_API_KEY",
] as const;

function validateRequiredEnv(keys: readonly string[]): void {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function readNumberEnv(key: string, fallback: number): number {
  const value = Number.parseInt(process.env[key] ?? "", 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getServerConfig() {
  validateRequiredEnv(requiredServerEnv);

  return {
    databaseUrl: process.env.DATABASE_URL!,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    nimApiKey: process.env.NIM_API_KEY!,
    nimBaseUrl: process.env.NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
    nimModel: process.env.NIM_MODEL ?? "stepfun-ai/step-3.5-flash",
    timeouts: {
      globalMs: readNumberEnv("AGENT_TIMEOUT_GLOBAL", 30000),
      llmMs: readNumberEnv("AGENT_TIMEOUT_LLM", 25000),
      toolMs: readNumberEnv("AGENT_TIMEOUT_TOOL", 5000),
      iterationMs: readNumberEnv("AGENT_TIMEOUT_ITERATION", 10000),
    },
  };
}

export function getPublicConfig() {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  };
}

