import type { Response } from 'express';
import type {
  CommentDto,
  PagedResponseDto,
  PostDto,
} from '@parrot-social/shared-dto';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import type { CommentRow, PostRow } from './posts.repository.js';
import type { PostsRepository } from './posts.repository.js';

export async function toPostDto(
  row: PostRow,
  comments: CommentRow[],
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<PostDto> {
  return {
    id: row.id,
    authorId: row.author_id,
    authorUsername: row.author_username,
    authorName: `${row.author_first_name} ${row.author_last_name}`,
    authorAvatar: await mediaRefBuilder.buildRefForMediaId(
      row.author_avatar_media_id,
      res,
    ),
    groupId: row.group_id ?? undefined,
    text: row.text,
    image: await mediaRefBuilder.buildRefForMediaId(row.image_media_id, res),
    createdAt: row.created_at.toISOString(),
    liked: row.liked,
    likeCount: row.like_count,
    upvoted: row.upvoted,
    upvoteCount: row.upvote_count,
    comments: await Promise.all(
      comments.map((comment) => toCommentDto(comment, mediaRefBuilder, res)),
    ),
  };
}

/** Shared "rows -> load comments -> toPostDto -> PagedResponseDto" shape used by the main feed,
 * by-author and by-group listings alike, so each controller method doesn't repeat it. */
export async function toPagedPostsDto(
  postsRepository: PostsRepository,
  rows: PostRow[],
  totalCount: number,
  page: number,
  pageSize: number,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<PagedResponseDto<PostDto>> {
  const comments = await postsRepository.findCommentsByPostIds(
    rows.map((row) => row.id),
  );
  const items = await Promise.all(
    rows.map((row) =>
      toPostDto(
        row,
        comments.filter((comment) => comment.post_id === row.id),
        mediaRefBuilder,
        res,
      ),
    ),
  );
  return { items, page, pageSize, totalCount };
}

export async function toCommentDto(
  row: CommentRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<CommentDto> {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    authorUsername: row.author_username,
    authorName: `${row.author_first_name} ${row.author_last_name}`,
    authorAvatar: await mediaRefBuilder.buildRefForMediaId(
      row.author_avatar_media_id,
      res,
    ),
    text: row.text,
    createdAt: row.created_at.toISOString(),
  };
}
