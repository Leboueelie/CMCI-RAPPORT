import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthStatus } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Vérifier l'état de l'application" })
  @ApiResponse({ status: 200, description: 'Application en bonne santé' })
  @ApiResponse({ status: 503, description: 'Service indisponible' })
  async check(): Promise<HealthStatus> {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Prêt à recevoir du trafic' })
  @ApiResponse({ status: 503, description: 'Pas encore prêt' })
  async ready(): Promise<{ ready: boolean; database: string }> {
    const status = await this.healthService.check();
    return {
      ready: status.status === 'ok',
      database: status.services.database,
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe (Kubernetes)' })
  @ApiResponse({ status: 200, description: 'Application vivante' })
  async live(): Promise<{ alive: boolean }> {
    return { alive: true };
  }
}
