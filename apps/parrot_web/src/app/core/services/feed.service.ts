import { Injectable, signal } from '@angular/core';
import { Post } from '../models/post.model';
import { INITIAL_POSTS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class FeedService {
  readonly posts = signal<Post[]>(
    INITIAL_POSTS.map((post) => ({ ...post, comments: [...post.comments] })),
  );

  addPost(text: string, authorName: string, authorAvatarUrl: string, authorId: string): void {
    const post: Post = {
      id: 'p-' + crypto.randomUUID(),
      authorId,
      authorName,
      authorAvatarUrl,
      text,
      liked: false,
      likeCount: 0,
      upvoted: false,
      upvoteCount: 0,
      comments: [],
    };
    this.posts.update((posts) => [post, ...posts]);
  }

  toggleLike(postId: string): void {
    this.posts.update((posts) =>
      posts.map((post) =>
        post.id === postId
          ? { ...post, liked: !post.liked, likeCount: post.likeCount + (post.liked ? -1 : 1) }
          : post,
      ),
    );
  }

  toggleUpvote(postId: string): void {
    this.posts.update((posts) =>
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              upvoted: !post.upvoted,
              upvoteCount: post.upvoteCount + (post.upvoted ? -1 : 1),
            }
          : post,
      ),
    );
  }

  addComment(postId: string, text: string, authorName: string, authorAvatarUrl: string): void {
    if (!text.trim()) {
      return;
    }
    this.posts.update((posts) =>
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                { id: 'c-' + crypto.randomUUID(), authorName, authorAvatarUrl, text },
              ],
            }
          : post,
      ),
    );
  }

  deletePost(postId: string): void {
    this.posts.update((posts) => posts.filter((post) => post.id !== postId));
  }
}
