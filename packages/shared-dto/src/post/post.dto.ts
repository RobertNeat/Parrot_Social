import { CommentDto } from './comment.dto.js';
import { MediaRefDto } from '../media/media.dto.js';

export class PostDto {
  id!: string;
  authorId!: string;
  authorUsername!: string;
  authorName!: string;
  authorAvatar?: MediaRefDto;
  /** Set when the post belongs to a group feed rather than the main feed. */
  groupId?: string;
  text!: string;
  image?: MediaRefDto;
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
  /** MediaDto.attachHandle from a prior upload. */
  imageAttachHandle?: string;
  /** Set to post into a group feed instead of the author's main feed. */
  groupId?: string;
}
