import { CommentDto } from './comment.dto.js';

export class PostDto {
  id!: string;
  authorId!: string;
  authorUsername!: string;
  authorName!: string;
  authorAvatarUrl?: string;
  /** Set when the post belongs to a group feed rather than the main feed. */
  groupId?: string;
  text!: string;
  imageUrl?: string;
  createdAt!: string;
  /** Viewer-relative: whether the requesting user liked/upvoted this post. */
  liked!: boolean;
  likeCount!: number;
  upvoted!: boolean;
  upvoteCount!: number;
  comments!: CommentDto[];
}

export class CreatePostRequestDto {
  text!: string;
  /** References a previously uploaded MediaDto.id. */
  imageMediaId?: string;
  /** Set to post into a group feed instead of the author's main feed. */
  groupId?: string;
}
