import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for API and database' })
  @ApiResponse({ status: 200, description: 'Service healthy' })
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`; // Simple DB test
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
