import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CommentDto, PagedResponseDto, PostDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { Comment, Post } from '../models/post.model';

const FALLBACK_AVATAR = 'resources/person/men_1.png';

/** Maps the real API shape to the local Post/Comment models still used by PostCard, shared with
 * group-page and profile pages that aren't wired to the backend yet. */
function toLocalPost(dto: PostDto): Post {
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

function toLocalComment(dto: CommentDto): Comment {
  return {
    id: dto.id,
    authorName: dto.authorName,
    authorAvatarUrl: dto.authorAvatar?.url ?? FALLBACK_AVATAR,
    text: dto.text,
  };
}

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

  async addPost(text: string): Promise<boolean> {
    try {
      const dto = await firstValueFrom(this.http.post<PostDto>(this.baseUrl, { text }));
      this.posts.update((posts) => [toLocalPost(dto), ...posts]);
      return true;
    } catch {
      return false;
    }
  }

  async toggleLike(postId: string): Promise<void> {
    const post = this.posts().find((p) => p.id === postId);
    if (!post) return;
    const dto = post.liked
      ? await firstValueFrom(this.http.delete<PostDto>(`${this.baseUrl}/${postId}/like`))
      : await firstValueFrom(this.http.post<PostDto>(`${this.baseUrl}/${postId}/like`, {}));
    this.replacePost(toLocalPost(dto));
  }

  async toggleUpvote(postId: string): Promise<void> {
    const post = this.posts().find((p) => p.id === postId);
    if (!post) return;
    const dto = post.upvoted
      ? await firstValueFrom(this.http.delete<PostDto>(`${this.baseUrl}/${postId}/upvote`))
      : await firstValueFrom(this.http.post<PostDto>(`${this.baseUrl}/${postId}/upvote`, {}));
    this.replacePost(toLocalPost(dto));
  }

  async addComment(postId: string, text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    await firstValueFrom(
      this.http.post<CommentDto>(`${this.baseUrl}/${postId}/comments`, {
        text: trimmed,
      }),
    );
    await this.load();
  }

  async deletePost(postId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.baseUrl}/${postId}`));
    this.posts.update((posts) => posts.filter((post) => post.id !== postId));
  }

  private replacePost(post: Post): void {
    this.posts.update((posts) => posts.map((p) => (p.id === post.id ? post : p)));
  }
}
