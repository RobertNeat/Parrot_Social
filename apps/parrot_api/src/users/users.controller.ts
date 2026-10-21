import {
  BadRequestException,
  Body,
  Controller,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  CurrentUserDto,
  UpdateProfileRequestDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaStorageService } from '../media/media-storage.service.js';
import { toCurrentUserDto } from './user.mapper.js';
import { UsersRepository } from './users.repository.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mediaStorage: MediaStorageService,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Body() body: UpdateProfileRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CurrentUserDto> {
    const userId = (req as Request & { user: { id: string } }).user.id;

    let avatarMediaId: string | undefined;
    if (body.avatarAttachHandle !== undefined) {
      avatarMediaId = await this.resolveOwnedMediaId(
        body.avatarAttachHandle,
        userId,
      );
    }
    let coverMediaId: string | undefined;
    if (body.coverAttachHandle !== undefined) {
      coverMediaId = await this.resolveOwnedMediaId(
        body.coverAttachHandle,
        userId,
      );
    }

    const row = await this.usersRepository.update(userId, {
      firstName: body.firstName,
      lastName: body.lastName,
      bio: body.bio,
      work: body.work,
      education: body.education,
      relationship: body.relationship,
      inhabitance: body.inhabitance,
      provenance: body.provenance,
      avatarMediaId,
      coverMediaId,
    });

    return toCurrentUserDto(row, this.mediaRefBuilder, res);
  }

  private async resolveOwnedMediaId(
    attachHandle: string,
    ownerId: string,
  ): Promise<string> {
    const mediaId = await this.mediaStorage.findOwnedIdByAttachHandle(
      attachHandle,
      ownerId,
    );
    if (!mediaId) {
      throw new BadRequestException(
        'attachHandle does not refer to media owned by the caller',
      );
    }
    return mediaId;
  }
}
