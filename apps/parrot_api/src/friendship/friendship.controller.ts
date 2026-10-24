import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type {
  FriendshipDto,
  FriendshipStatusDto,
  SendFriendRequestDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { requireUuid } from '../common/validation.js';
import { toFriendshipDto, toFriendshipStatusDto } from './friendship.mapper.js';
import { FriendshipRepository } from './friendship.repository.js';

@Controller('friendship')
@UseGuards(JwtAuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipRepository: FriendshipRepository) {}

  @Get('status/:userId')
  async getStatus(
    @Param('userId') userIdRaw: string,
    @Req() req: Request,
  ): Promise<FriendshipStatusDto> {
    const viewerId = callerId(req);
    const otherUserId = requireUuid(userIdRaw, 'userId');
    const row = await this.friendshipRepository.findBetween(
      viewerId,
      otherUserId,
    );
    return toFriendshipStatusDto(viewerId, row);
  }

  @Post('requests')
  async sendRequest(
    @Body() body: SendFriendRequestDto,
    @Req() req: Request,
  ): Promise<FriendshipDto> {
    const requesterId = callerId(req);
    const addresseeId = requireUuid(body.addresseeId, 'addresseeId');
    if (addresseeId === requesterId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }
    const existing = await this.friendshipRepository.findBetween(
      requesterId,
      addresseeId,
    );
    if (existing) {
      throw new ConflictException(
        existing.status === 'accepted'
          ? 'You are already friends with this user'
          : 'A friend request already exists between you and this user',
      );
    }
    const row = await this.friendshipRepository.create(
      requesterId,
      addresseeId,
    );
    return toFriendshipDto(row);
  }

  // 200, not the Nest POST default 201 - this mutates an existing resource's status, not
  // creating a new one (matches notifications' mark-all-read convention).
  @Post('requests/:id/accept')
  @HttpCode(200)
  async accept(
    @Param('id') idRaw: string,
    @Req() req: Request,
  ): Promise<FriendshipDto> {
    const addresseeId = callerId(req);
    const id = requireUuid(idRaw, 'id');
    const row = await this.friendshipRepository.accept(id, addresseeId);
    if (!row) {
      throw new NotFoundException(
        'Friend request not found, already resolved, or not addressed to you',
      );
    }
    return toFriendshipDto(row);
  }

  @Post('requests/:id/decline')
  @HttpCode(200)
  async decline(
    @Param('id') idRaw: string,
    @Req() req: Request,
  ): Promise<{ id: string }> {
    const callerUserId = callerId(req);
    const id = requireUuid(idRaw, 'id');
    const row = await this.friendshipRepository.declineOrCancel(
      id,
      callerUserId,
    );
    if (!row) {
      throw new NotFoundException(
        'Friend request not found, already resolved, or not related to you',
      );
    }
    return { id: row.id };
  }

  /** Unfriend: deletes an accepted friendship with `:userId`. Not in the original findings list,
   * but falls naturally out of the design and closes the loop started by `sendRequest`. */
  @Delete(':userId')
  async unfriend(
    @Param('userId') userIdRaw: string,
    @Req() req: Request,
  ): Promise<{ removed: boolean }> {
    const callerUserId = callerId(req);
    const otherUserId = requireUuid(userIdRaw, 'userId');
    const removed = await this.friendshipRepository.deleteAccepted(
      callerUserId,
      otherUserId,
    );
    return { removed };
  }
}

function callerId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}
