import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  ChatMessageDto,
  ConversationDto,
  SendMessageRequestDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { MediaStorageService } from '../media/media-storage.service.js';
import {
  optionalUuid,
  requireString,
  requireUuid,
} from '../common/validation.js';
import { toChatMessageDto, toConversationDto } from './chat.mapper.js';
import { ChatRepository } from './chat.repository.js';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly mediaStorage: MediaStorageService,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  @Get('conversations')
  async listConversations(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ConversationDto[]> {
    const viewerId = userId(req);
    const rows = await this.chatRepository.findConversationsForUser(viewerId);
    const messages = await this.chatRepository.findMessagesByConversationIds(
      rows.map((row) => row.id),
    );
    return Promise.all(
      rows.map((row) =>
        toConversationDto(
          row,
          messages.filter((message) => message.conversation_id === row.id),
          this.mediaRefBuilder,
          res,
          viewerId,
        ),
      ),
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Param('id') idRaw: string,
    @Body() body: SendMessageRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ChatMessageDto> {
    const conversationId = requireUuid(idRaw, 'id');
    const senderId = userId(req);
    const text = requireString(body.text, 'text', {
      minLength: 1,
      maxLength: 5000,
    }).trim();
    if (text.length === 0) {
      throw new BadRequestException('text must not be blank');
    }
    const imageAttachHandle = optionalUuid(
      body.imageAttachHandle,
      'imageAttachHandle',
    );

    await this.ensureParticipant(conversationId, senderId);

    const imageMediaId = imageAttachHandle
      ? await this.resolveOwnedMediaId(imageAttachHandle, senderId)
      : undefined;

    const row = await this.chatRepository.insertMessage({
      conversationId,
      senderId,
      text,
      imageMediaId,
    });
    return toChatMessageDto(row, this.mediaRefBuilder, res, senderId);
  }

  private async ensureParticipant(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    if (!(await this.chatRepository.isParticipant(conversationId, userId))) {
      throw new NotFoundException('Conversation not found');
    }
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

function userId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}
