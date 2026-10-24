import type { CommentDto, PostDto } from '@parrot-social/shared-dto';
import { Comment, Post } from '../models/post.model';
import { FALLBACK_AVATAR } from './user.mapper';

/** Maps the real API shape to the local Post/Comment models used by PostCard, shared by
 * feed/profile/group pages so each page doesn't duplicate this mapping. */
export function toLocalPost(dto: PostDto): Post {
  return {
    id: dto.id,
    authorId: dto.authorId,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatar?.url ?? FALLBACK_AVATAR,
    imageUrl: dto.image?.url,
    text: dto.text,
    liked: dto.liked,
    likeCount: dto.likeCount,
    upvoted: dto.upvoted,
    upvoteCount: dto.upvoteCount,
    comments: dto.comments.map(toLocalComment),
  };
}

export function toLocalComment(dto: CommentDto): Comment {
  return {
    id: dto.id,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatar?.url ?? FALLBACK_AVATAR,
    text: dto.text,
  };
}
