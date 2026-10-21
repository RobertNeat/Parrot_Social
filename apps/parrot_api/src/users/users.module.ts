import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { UsersRepository } from './users.repository.js';

@Module({
  imports: [MediaModule],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
