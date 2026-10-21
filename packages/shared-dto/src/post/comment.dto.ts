import { MediaRefDto } from '../media/media.dto.js';

export class CommentDto {
  id!: string;
  postId!: string;
  authorId!: string;
  authorUsername!: string;
  authorName!: string;
  authorAvatar?: MediaRefDto;
  text!: string;
  createdAt!: string;
}

export class CreateCommentRequestDto {
  text!: string;
}
