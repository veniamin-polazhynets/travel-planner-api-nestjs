import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message: string = 'Database error occurred';
    let error: string = 'Internal server error';
    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (exception.code) {
      case 'P2002': {
        error = 'Conflict';
        statusCode = HttpStatus.CONFLICT;

        const target = exception.meta?.target;
        const field = Array.isArray(target) ? target.join(', ') : 'field';

        message = `Record with this ${field} already exists`;
        break;
      }

      case 'P2025': {
        message = `Record not found`;
        error = 'Not Found';
        statusCode = HttpStatus.NOT_FOUND;
        break;
      }

      default:
        this.logger.error(
          `Unhandled Prisma error: ${exception.message}`,
          exception.stack,
        );
        break;
    }

    response.status(statusCode).json({
      message,
      error,
      statusCode,
    });
  }
}
