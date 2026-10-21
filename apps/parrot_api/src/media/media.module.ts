import { Module } from '@nestjs/common';
import { MediaAccessController } from './media-access.controller.js';
import { MediaStreamController } from './media-stream.controller.js';
import { MediaAccessService } from './media-access.service.js';
import { MediaRefBuilderService } from './media-ref-builder.service.js';
import {
  MediaAccessStore,
  InMemoryMediaAccessStore,
} from './media-access.store.js';
import { MediaStorageService } from './media-storage.service.js';

@Module({
  controllers: [MediaAccessController, MediaStreamController],
  providers: [
    MediaAccessService,
    MediaRefBuilderService,
    MediaStorageService,
    { provide: MediaAccessStore, useClass: InMemoryMediaAccessStore },
  ],
  exports: [MediaRefBuilderService, MediaStorageService],
})
export class MediaModule {}
