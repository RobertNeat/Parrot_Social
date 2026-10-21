import type { Response } from 'express';
import type { CommentDto, PostDto } from '@parrot-social/shared-dto';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import type { CommentRow, PostRow } from './posts.repository.js';

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
