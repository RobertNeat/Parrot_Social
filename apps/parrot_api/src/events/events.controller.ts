import {
  BadRequestException,
  Body,
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
import type {
  CreateEventRequestDto,
  EventDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { MediaStorageService } from '../media/media-storage.service.js';
import {
  optionalString,
  optionalUuid,
  requireIsoDate,
  requireString,
  requireUuid,
} from '../common/validation.js';
import { toEventDto } from './event.mapper.js';
import { EventsRepository } from './events.repository.js';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly mediaRefBuilder: MediaRefBuilderService,
    private readonly mediaStorage: MediaStorageService,
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

  @Post()
  async create(
    @Body() body: CreateEventRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EventDto> {
    const organizerId = userId(req);
    const title = requireString(body.title, 'title', {
      minLength: 1,
      maxLength: 255,
    });
    const description = requireString(body.description, 'description', {
      minLength: 1,
    });
    const startsAt = requireIsoDate(body.startsAt, 'startsAt');
    const location = optionalString(body.location, 'location', {
      maxLength: 255,
    });
    const imageAttachHandle = optionalUuid(
      body.imageAttachHandle,
      'imageAttachHandle',
    );
    const imageMediaId = imageAttachHandle
      ? await this.resolveOwnedMediaId(imageAttachHandle, organizerId)
      : undefined;

    const eventId = await this.eventsRepository.create({
      title,
      description,
      startsAt,
      location,
      imageMediaId,
      createdBy: organizerId,
    });
    return this.loadEventDto(eventId, organizerId, res);
  }

  @Get(':id')
  async getById(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<EventDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    return this.loadEventDto(id, viewerId, res);
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

  private async resolveOwnedMediaId(
    attachHandle: string,
    ownerId: string,
  ): Promise<string> {
    const mediaId = await this.mediaStorage.findOwnedIdByAttachHandle(
      attachHandle,
      ownerId,
    );
    if (!mediaId) {
      throw new BadRequestException(
        'attachHandle does not refer to media owned by the caller',
      );
    }
    return mediaId;
  }
}

function userId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}
