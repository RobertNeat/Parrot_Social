import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { NotificationDto } from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { toNotificationDto } from './notification.mapper.js';
import { NotificationsRepository } from './notifications.repository.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NotificationDto[]> {
    const viewerId = userId(req);
    const rows = await this.notificationsRepository.findByRecipient(viewerId);
    return Promise.all(
      rows.map((row) => toNotificationDto(row, this.mediaRefBuilder, res)),
    );
  }

  // 200, not the Nest POST default 201 - this isn't creating a resource, just mutating existing ones.
  @Post('mark-all-read')
  @HttpCode(200)
  async markAllRead(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<NotificationDto[]> {
    const viewerId = userId(req);
    await this.notificationsRepository.markAllReadForRecipient(viewerId);
    const rows = await this.notificationsRepository.findByRecipient(viewerId);
    return Promise.all(
      rows.map((row) => toNotificationDto(row, this.mediaRefBuilder, res)),
    );
  }
}

function userId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}
