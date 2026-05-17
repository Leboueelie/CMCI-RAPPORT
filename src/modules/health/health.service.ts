import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'connected' | 'disconnected';
    memory: 'ok' | 'critical';
  };
  memory: {
    used: string;
    total: string;
    percentage: number;
  };
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private prisma: PrismaService) {}

  async check(): Promise<HealthStatus> {
    const dbStatus = await this.checkDatabase();
    const memoryStatus = this.checkMemory();

    return {
      status:
        dbStatus === 'connected' && memoryStatus.status === 'ok'
          ? 'ok'
          : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: '1.0.0',
      services: {
        database: dbStatus,
        memory: memoryStatus.status,
      },
      memory: {
        used: memoryStatus.used,
        total: memoryStatus.total,
        percentage: memoryStatus.percentage,
      },
    };
  }

  private async checkDatabase(): Promise<'connected' | 'disconnected'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private checkMemory(): {
    status: 'ok' | 'critical';
    used: string;
    total: string;
    percentage: number;
  } {
    const used = process.memoryUsage();
    const total = require('os').totalmem();
    const usedMB = Math.round(used.heapUsed / 1024 / 1024);
    const totalMB = Math.round(total / 1024 / 1024);
    const percentage = Math.round((used.heapUsed / total) * 100);

    return {
      status: percentage > 90 ? 'critical' : 'ok',
      used: `${usedMB}MB`,
      total: `${totalMB}MB`,
      percentage,
    };
  }
}
