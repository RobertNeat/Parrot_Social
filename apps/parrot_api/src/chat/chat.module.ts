import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { ChatController } from './chat.controller.js';
import { ChatRepository } from './chat.repository.js';

@Module({
  imports: [MediaModule],
  controllers: [ChatController],
  providers: [ChatRepository],
})
export class ChatModule {}
