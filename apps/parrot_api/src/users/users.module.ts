import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';

@Module({
  imports: [MediaModule],
  controllers: [UsersController],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
