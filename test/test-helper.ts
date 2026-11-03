import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaClientExceptionFilter } from '../src/common/filters';
import { PrismaService } from '../src/prisma/prisma.service';

export class TestHelper {
  app: INestApplication;
  prisma: PrismaService;
  async initApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();

    this.app.use(cookieParser());
    this.app.useGlobalFilters(new PrismaClientExceptionFilter());
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await this.app.init();
    this.prisma = this.app.get(PrismaService);

    return this.app;
  }
  async cleanDatabase(): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE users, trips, expenses RESTART IDENTITY CASCADE',
    );
  }
  async closeApp(): Promise<void> {
    await this.prisma.$disconnect();
    await this.app.close();
  }
}
