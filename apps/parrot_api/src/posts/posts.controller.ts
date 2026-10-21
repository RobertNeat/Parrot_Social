import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  CommentDto,
  CreateCommentRequestDto,
  CreatePostRequestDto,
  PagedResponseDto,
  PostDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { MediaStorageService } from '../media/media-storage.service.js';
import {
  optionalUuid,
  requireString,
  requireUuid,
} from '../common/validation.js';
import { toCommentDto, toPostDto } from './post.mapper.js';
import { PostsRepository } from './posts.repository.js';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly mediaStorage: MediaStorageService,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  @Get()
  async list(
    @Query('page') pageRaw: string | undefined,
    @Query('pageSize') pageSizeRaw: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PagedResponseDto<PostDto>> {
    const viewerId = userId(req);
    const page = parsePositiveInt(pageRaw, 1);
    const pageSize = parsePositiveInt(pageSizeRaw, 20);

    const { rows, totalCount } = await this.postsRepository.findMainFeed(
      viewerId,
      page,
      pageSize,
    );
    const comments = await this.postsRepository.findCommentsByPostIds(
      rows.map((row) => row.id),
    );
    const items = await Promise.all(
      rows.map((row) =>
        toPostDto(
          row,
          comments.filter((comment) => comment.post_id === row.id),
          this.mediaRefBuilder,
          res,
        ),
      ),
    );

    return { items, page, pageSize, totalCount };
  }

  @Post()
  async create(
    @Body() body: CreatePostRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostDto> {
    const authorId = userId(req);
    const text = requireString(body.text, 'text', {
      minLength: 1,
      maxLength: 5000,
    });
    const imageAttachHandle = optionalUuid(
      body.imageAttachHandle,
      'imageAttachHandle',
    );
    // groupId posting isn't supported until the Groups slice - never accept it unchecked.
    if (body.groupId !== undefined) {
      throw new BadRequestException(
        'Posting into a group is not supported yet',
      );
    }

    const imageMediaId = imageAttachHandle
      ? await this.resolveOwnedMediaId(imageAttachHandle, authorId)
      : undefined;

    const postId = await this.postsRepository.create({
      authorId,
      text,
      imageMediaId,
    });
    return this.loadPostDto(postId, authorId, res);
  }

  @Delete(':id')
  async remove(
    @Param('id') idRaw: string,
    @Req() req: Request,
  ): Promise<{ id: string }> {
    const id = requireUuid(idRaw, 'id');
    const authorId = userId(req);
    const deletedId = await this.postsRepository.deleteOwned(id, authorId);
    if (!deletedId) {
      throw new NotFoundException('Post not found');
    }
    return { id: deletedId };
  }

  @Post(':id/like')
  async like(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    await this.postsRepository.like(id, viewerId);
    return this.loadPostDto(id, viewerId, res);
  }

  @Delete(':id/like')
  async unlike(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    await this.postsRepository.unlike(id, viewerId);
    return this.loadPostDto(id, viewerId, res);
  }

  @Post(':id/upvote')
  async upvote(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    await this.postsRepository.upvote(id, viewerId);
    return this.loadPostDto(id, viewerId, res);
  }

  @Delete(':id/upvote')
  async removeUpvote(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PostDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    await this.postsRepository.removeUpvote(id, viewerId);
    return this.loadPostDto(id, viewerId, res);
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') idRaw: string,
    @Body() body: CreateCommentRequestDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CommentDto> {
    const id = requireUuid(idRaw, 'id');
    const authorId = userId(req);
    const text = requireString(body.text, 'text', {
      minLength: 1,
      maxLength: 2000,
    });
    await this.ensureExists(id);
    const commentId = await this.postsRepository.addComment({
      postId: id,
      authorId,
      text,
    });
    const comments = await this.postsRepository.findCommentsByPostIds([id]);
    const created = comments.find((row) => row.id === commentId);
    if (!created) {
      throw new NotFoundException('Comment not found after creation');
    }
    return toCommentDto(created, this.mediaRefBuilder, res);
  }

  private async ensureExists(postId: string): Promise<void> {
    if (!(await this.postsRepository.exists(postId))) {
      throw new NotFoundException('Post not found');
    }
  }

  private async loadPostDto(
    postId: string,
    viewerId: string,
    res: Response,
  ): Promise<PostDto> {
    const row = await this.postsRepository.findById(postId, viewerId);
    if (!row) {
      throw new NotFoundException('Post not found');
    }
    const comments = await this.postsRepository.findCommentsByPostIds([postId]);
    return toPostDto(row, comments, this.mediaRefBuilder, res);
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

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
