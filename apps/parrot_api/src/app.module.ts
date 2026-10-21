import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseErrorFilter } from './common/database-error.filter.js';
import { DatabaseModule } from './database/database.module.js';
import { MediaModule } from './media/media.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { GroupsModule } from './groups/groups.module.js';

@Module({
  imports: [
    DatabaseModule,
    MediaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: DatabaseErrorFilter },
  ],
})
export class AppModule {}
