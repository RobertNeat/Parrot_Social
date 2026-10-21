import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module.js';
import { PostsModule } from '../posts/posts.module.js';
import { GroupsController } from './groups.controller.js';
import { GroupsRepository } from './groups.repository.js';

@Module({
  imports: [MediaModule, PostsModule],
  controllers: [GroupsController],
  providers: [GroupsRepository],
})
export class GroupsModule {}
