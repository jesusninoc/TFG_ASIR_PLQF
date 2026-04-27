/**
 * Simple in-memory metrics collector.
 * Can be extended to Prometheus or OpenTelemetry in production.
 */

export interface MetricsCollector {
  // Counters
  increment(key: string, labels?: Record<string, string>): void;
  // Histograms / durations
  recordDuration(key: string, ms: number, labels?: Record<string, string>): void;
  // Gauges
  gaugeSet(key: string, value: number, labels?: Record<string, string>): void;
  // Get snapshot
  snapshot(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    durations: Record<string, { count: number; sum: number; avg: number; p95: number; p99: number }>;
  };
}

class InMemoryMetricsCollector implements MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private durations = new Map<string, number[]>();

  private labelString(labels?: Record<string, string>): string {
    if (!labels) return "";
    const kv = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}="${v}"`);
    return `{${kv.join(",")}}`;
  }

  increment(key: string, labels?: Record<string, string>): void {
    const fullKey = labels ? `${key}${this.labelString(labels)}` : key;
    const curr = this.counters.get(fullKey) ?? 0;
    this.counters.set(fullKey, curr + 1);
  }

  recordDuration(key: string, ms: number, labels?: Record<string, string>): void {
    const fullKey = labels ? `${key}${this.labelString(labels)}` : key;
    const bucket = this.durations.get(fullKey) ?? [];
    bucket.push(ms);
    this.durations.set(fullKey, bucket);
  }

  gaugeSet(key: string, value: number, labels?: Record<string, string>): void {
    const fullKey = labels ? `${key}${this.labelString(labels)}` : key;
    this.gauges.set(fullKey, value);
  }

  snapshot(): { counters: Record<string, number>; gauges: Record<string, number>; durations: Record<string, { count: number; sum: number; avg: number; p95: number; p99: number }> } {
    const durationsSummary: Record<string, { count: number; sum: number; avg: number; p95: number; p99: number }> = {};
    for (const [key, values] of this.durations.entries()) {
      if (values.length === 0) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const avg = sum / sorted.length;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
      const p99 = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
      durationsSummary[key] = { count: values.length, sum, avg, p95, p99 };
    }
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      durations: durationsSummary,
    };
  }
}

// Singleton global collector
let globalCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new InMemoryMetricsCollector();
  }
  return globalCollector;
}

export function resetMetrics(): void {
  globalCollector = null;
}
