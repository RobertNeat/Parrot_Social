import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PagedResponseDto, PostDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post.model';
import { toLocalPost } from './post.mapper';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/posts`;

  readonly posts = signal<Post[]>([]);
  readonly loading = signal(false);

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<PagedResponseDto<PostDto>>(this.baseUrl, {
          params: { page: 1, pageSize: 50 },
        }),
      );
      this.posts.set(response.items.map(toLocalPost));
    } finally {
      this.loading.set(false);
    }
  }

  async addPost(text: string, groupId?: string): Promise<Post | null> {
    try {
      const dto = await firstValueFrom(this.http.post<PostDto>(this.baseUrl, { text, groupId }));
      const post = toLocalPost(dto);
      if (!groupId) {
        this.posts.update((posts) => [post, ...posts]);
      }
      return post;
    } catch {
      return null;
    }
  }

  /** Caller passes the post's CURRENT liked state (since this post may not live in
   * `this.posts()` - e.g. shown on a profile/group page) and applies the returned Post to its
   * own list itself. */
  async toggleLike(postId: string, currentlyLiked: boolean): Promise<Post> {
    const dto = currentlyLiked
      ? await firstValueFrom(this.http.delete<PostDto>(`${this.baseUrl}/${postId}/like`))
      : await firstValueFrom(this.http.post<PostDto>(`${this.baseUrl}/${postId}/like`, {}));
    return toLocalPost(dto);
  }

  async toggleUpvote(postId: string, currentlyUpvoted: boolean): Promise<Post> {
    const dto = currentlyUpvoted
      ? await firstValueFrom(this.http.delete<PostDto>(`${this.baseUrl}/${postId}/upvote`))
      : await firstValueFrom(this.http.post<PostDto>(`${this.baseUrl}/${postId}/upvote`, {}));
    return toLocalPost(dto);
  }

  /** Returns the updated Post (backend returns the full post, not just the new comment) so
   * callers can apply it to their own local list rather than reloading the wrong feed. */
  async addComment(postId: string, text: string): Promise<Post | null> {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }
    const dto = await firstValueFrom(
      this.http.post<PostDto>(`${this.baseUrl}/${postId}/comments`, {
        text: trimmed,
      }),
    );
    return toLocalPost(dto);
  }

  async deletePost(postId: string): Promise<boolean> {
    try {
      await firstValueFrom(this.http.delete(`${this.baseUrl}/${postId}`));
      this.posts.update((posts) => posts.filter((post) => post.id !== postId));
      return true;
    } catch {
      return false;
    }
  }
}
