// Performance monitoring utilities
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  startTimer(name: string, metadata?: Record<string, any>): void {
    this.timers.set(name, performance.now());
    if (metadata) {
      this.timers.set(`${name}_metadata`, metadata as any);
    }
  }

  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    const metadata = this.timers.get(`${name}_metadata`) as Record<string, any> | undefined;
    
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata
    });

    this.timers.delete(name);
    this.timers.delete(`${name}_metadata`);

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  getAverageTime(name: string): number {
    const relevantMetrics = this.metrics.filter(m => m.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const total = relevantMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / relevantMetrics.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Decorator for timing functions
export function timed(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const timerName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.startTimer(timerName);
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        performanceMonitor.endTimer(timerName);
      }
    };

    return descriptor;
  };
}

// Database query performance tracking
export function trackQuery(query: string, params?: any[]) {
  const queryHash = query.substring(0, 50).replace(/\s+/g, ' ');
  performanceMonitor.startTimer(`db_query`, { 
    query: queryHash, 
    paramCount: params?.length || 0 
  });
  
  return {
    end: () => performanceMonitor.endTimer(`db_query`)
  };
}