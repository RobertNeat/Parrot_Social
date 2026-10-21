import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  CurrentUserDto,
  UpdateProfileRequestDto,
  UserProfileDto,
  UserSummaryDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaStorageService } from '../media/media-storage.service.js';
import {
  optionalNullableString,
  optionalString,
  optionalUuid,
  requireUuid,
} from '../common/validation.js';
import {
  toCurrentUserDto,
  toUserProfileDto,
  toUserSummaryDto,
} from './user.mapper.js';
import { UsersRepository } from './users.repository.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly mediaStorage: MediaStorageService,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  // Literal routes (me/friends, me/contacts) must be declared above the parameterized :id
  // route below, or Nest matches "me" as :id first.
  @UseGuards(JwtAuthGuard)
  @Get('me/friends')
  async getMyFriends(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserSummaryDto[]> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    const rows = await this.usersRepository.findAcceptedFriends(userId);
    return Promise.all(
      rows.map((row) => toUserSummaryDto(row, this.mediaRefBuilder, res)),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/contacts')
  async getMyContacts(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserSummaryDto[]> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    const rows = await this.usersRepository.findContacts(userId);
    return Promise.all(
      rows.map((row) => toUserSummaryDto(row, this.mediaRefBuilder, res)),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(
    @Param('id') idRaw: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserProfileDto> {
    const id = requireUuid(idRaw, 'id');
    const row = await this.usersRepository.findById(id);
    if (!row) {
      throw new NotFoundException('User not found');
    }
    return toUserProfileDto(row, this.mediaRefBuilder, res);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @Body() body: UpdateProfileRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CurrentUserDto> {
    const userId = (req as Request & { user: { id: string } }).user.id;

    const firstName = optionalString(body.firstName, 'firstName', {
      maxLength: 100,
    });
    const lastName = optionalString(body.lastName, 'lastName', {
      maxLength: 100,
    });
    const bio = optionalNullableString(body.bio, 'bio');
    const work = optionalNullableString(body.work, 'work', { maxLength: 255 });
    const education = optionalNullableString(body.education, 'education', {
      maxLength: 255,
    });
    const relationship = optionalNullableString(
      body.relationship,
      'relationship',
      { maxLength: 100 },
    );
    const inhabitance = optionalNullableString(
      body.inhabitance,
      'inhabitance',
      { maxLength: 255 },
    );
    const provenance = optionalNullableString(body.provenance, 'provenance', {
      maxLength: 255,
    });
    const avatarAttachHandle = optionalUuid(
      body.avatarAttachHandle,
      'avatarAttachHandle',
    );
    const coverAttachHandle = optionalUuid(
      body.coverAttachHandle,
      'coverAttachHandle',
    );

    const avatarMediaId =
      avatarAttachHandle !== undefined
        ? await this.resolveOwnedMediaId(avatarAttachHandle, userId)
        : undefined;
    const coverMediaId =
      coverAttachHandle !== undefined
        ? await this.resolveOwnedMediaId(coverAttachHandle, userId)
        : undefined;

    const row = await this.usersRepository.update(userId, {
      firstName,
      lastName,
      bio,
      work,
      education,
      relationship,
      inhabitance,
      provenance,
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
