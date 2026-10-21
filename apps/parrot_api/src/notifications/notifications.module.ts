import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';

@Module({
  imports: [MediaModule],
  controllers: [NotificationsController],
  providers: [NotificationsRepository],
})
export class NotificationsModule {}
