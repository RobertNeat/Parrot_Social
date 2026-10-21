import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { PostsController } from './posts.controller.js';
import { PostsRepository } from './posts.repository.js';

@Module({
  imports: [MediaModule],
  controllers: [PostsController],
  providers: [PostsRepository],
  exports: [PostsRepository],
})
export class PostsModule {}
