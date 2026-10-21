export class CommentDto {
  id!: string;
  postId!: string;
  authorId!: string;
  authorUsername!: string;
  authorName!: string;
  authorAvatarUrl?: string;
  text!: string;
  createdAt!: string;
}

export class CreateCommentRequestDto {
  text!: string;
}
