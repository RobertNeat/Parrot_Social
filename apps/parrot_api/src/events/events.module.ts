import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { EventsController } from './events.controller.js';
import { EventsRepository } from './events.repository.js';

@Module({
  imports: [MediaModule],
  controllers: [EventsController],
  providers: [EventsRepository],
})
export class EventsModule {}
