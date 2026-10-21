import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { EventDto } from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { requireUuid } from '../common/validation.js';
import { toEventDto } from './event.mapper.js';
import { EventsRepository } from './events.repository.js';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EventDto[]> {
    const viewerId = userId(req);
    const rows = await this.eventsRepository.findAll(viewerId);
    return Promise.all(
      rows.map((row) => toEventDto(row, this.mediaRefBuilder, res)),
    );
  }

  @Post(':id/interested')
  async markInterested(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EventDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    await this.eventsRepository.markInterested(id, viewerId);
    return this.loadEventDto(id, viewerId, res);
  }

  @Delete(':id/interested')
  async unmarkInterested(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EventDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    await this.eventsRepository.unmarkInterested(id, viewerId);
    return this.loadEventDto(id, viewerId, res);
  }

  private async ensureExists(eventId: string): Promise<void> {
    if (!(await this.eventsRepository.exists(eventId))) {
      throw new NotFoundException('Event not found');
    }
  }

  private async loadEventDto(
    eventId: string,
    viewerId: string,
    res: Response,
  ): Promise<EventDto> {
    const row = await this.eventsRepository.findById(eventId, viewerId);
    if (!row) {
      throw new NotFoundException('Event not found');
    }
    return toEventDto(row, this.mediaRefBuilder, res);
  }
}

function userId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}
