import { Injectable } from '@nestjs/common';

export interface EndpointMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastAccessTime: Date;
}

export interface MetricsData {
  uptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  activeRequests: number;
  averageResponseTime: number;
  endpoints: Record<string, EndpointMetrics>;
  systemInfo: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    nodeVersion: string;
    platform: string;
  };
  timestamp: Date;
}

@Injectable()
export class MetricsService {
  private startTime: number = Date.now();
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private activeRequests: number = 0;
  private totalResponseTime: number = 0;
  private endpoints: Map<string, EndpointMetrics> = new Map();

  /**
   * Registra el inicio de una request
   */
  startRequest(): void {
    this.activeRequests++;
  }

  /**
   * Registra el fin de una request
   */
  endRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
  ): void {
    this.activeRequests--;
    this.totalRequests++;
    this.totalResponseTime += responseTime;

    if (statusCode >= 200 && statusCode < 400) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    // Registrar métricas por endpoint
    const endpointKey = `${method} ${path}`;
    const endpointMetrics = this.endpoints.get(endpointKey) || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      lastAccessTime: new Date(),
    };

    endpointMetrics.totalRequests++;
    endpointMetrics.totalResponseTime += responseTime;
    endpointMetrics.minResponseTime = Math.min(
      endpointMetrics.minResponseTime,
      responseTime,
    );
    endpointMetrics.maxResponseTime = Math.max(
      endpointMetrics.maxResponseTime,
      responseTime,
    );
    endpointMetrics.lastAccessTime = new Date();

    if (statusCode >= 200 && statusCode < 400) {
      endpointMetrics.successfulRequests++;
    } else {
      endpointMetrics.failedRequests++;
    }

    this.endpoints.set(endpointKey, endpointMetrics);
  }

  /**
   * Obtiene todas las métricas
   */
  getMetrics(): MetricsData {
    const uptime = (Date.now() - this.startTime) / 1000; // segundos
    const averageResponseTime =
      this.totalRequests > 0 ? this.totalResponseTime / this.totalRequests : 0;

    // Convertir Map a Object para el JSON
    const endpointsObj: Record<string, EndpointMetrics> = {};
    this.endpoints.forEach((value, key) => {
      endpointsObj[key] = {
        ...value,
        minResponseTime:
          value.minResponseTime === Infinity ? 0 : value.minResponseTime,
      };
    });

    return {
      uptime,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      activeRequests: this.activeRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      endpoints: endpointsObj,
      systemInfo: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Resetea todas las métricas (útil para testing o mantenimiento)
   */
  resetMetrics(): void {
    this.startTime = Date.now();
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.activeRequests = 0;
    this.totalResponseTime = 0;
    this.endpoints.clear();
  }
}
