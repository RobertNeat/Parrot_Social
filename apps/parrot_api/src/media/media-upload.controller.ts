import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import type { MediaDto } from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaStorageService } from './media-storage.service.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Local shape instead of Express.Multer.File - @types/multer isn't a project dependency
// (only @nestjs/platform-express is), and that type isn't resolvable without it.
interface UploadedMulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('media')
export class MediaUploadController {
  constructor(private readonly mediaStorage: MediaStorageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
    }),
  )
  async upload(
    @UploadedFile() file: UploadedMulterFile | undefined,
    @Req() req: Request,
  ): Promise<MediaDto> {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('unsupported mime type');
    }

    const userId = (req as Request & { user: { id: string } }).user.id;
    return this.mediaStorage.saveUpload(
      file.buffer,
      file.originalname,
      file.mimetype,
      userId,
    );
  }
}
