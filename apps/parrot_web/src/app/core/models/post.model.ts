export interface Comment {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  text: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  imageUrl?: string;
  text: string;
  liked: boolean;
  likeCount: number;
  upvoted: boolean;
  upvoteCount: number;
  comments: Comment[];
}
