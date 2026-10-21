import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseError } from 'pg';

/** Maps Postgres error codes that can surface from any raw-SQL query (unique violation, FK
 * violation, invalid input syntax, value too long) to proper HTTP errors instead of a bare 500.
 * Registered globally (APP_FILTER) so every module benefits without repeating try/catch. */
@Catch(DatabaseError)
export class DatabaseErrorFilter implements ExceptionFilter {
  catch(exception: DatabaseError, host: ArgumentsHost): void {
    const mapped = this.map(exception);
    const response = host.switchToHttp().getResponse();
    response.status(mapped.getStatus()).json(mapped.getResponse());
  }

  private map(exception: DatabaseError): HttpException {
    switch (exception.code) {
      case '23505': // unique_violation
        return new ConflictException('Resource already exists');
      case '23503': // foreign_key_violation
        return new NotFoundException('Referenced resource does not exist');
      case '22P02': // invalid_text_representation (e.g. malformed uuid)
      case '22001': // string_data_right_truncation (value too long)
        return new BadRequestException('Invalid request data');
      default:
        return new InternalServerErrorException('Unexpected database error');
    }
  }
}
