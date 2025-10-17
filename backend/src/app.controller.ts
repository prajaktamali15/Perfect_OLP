import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`; // Simple DB test
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
