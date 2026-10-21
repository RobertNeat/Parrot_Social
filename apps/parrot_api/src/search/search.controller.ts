import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { SearchResultDto } from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SearchService } from './search.service.js';

const QUERY_MIN_LENGTH = 2;
const QUERY_MAX_LENGTH = 100;

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') qRaw: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SearchResultDto> {
    const query = (qRaw ?? '').trim();
    if (query.length < QUERY_MIN_LENGTH) {
      throw new BadRequestException(
        `q must be at least ${QUERY_MIN_LENGTH} characters`,
      );
    }
    if (query.length > QUERY_MAX_LENGTH) {
      throw new BadRequestException(
        `q must be at most ${QUERY_MAX_LENGTH} characters`,
      );
    }
    const viewerId = userId(req);
    return this.searchService.search(query, viewerId, res);
  }
}

function userId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}
