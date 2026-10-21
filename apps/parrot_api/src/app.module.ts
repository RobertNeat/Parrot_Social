import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { MediaModule } from './media/media.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [DatabaseModule, MediaModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
