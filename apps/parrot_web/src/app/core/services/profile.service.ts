import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { PagedResponseDto, PostDto, UserProfileDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../models/user.model';
import { Post } from '../models/post.model';
import { toLocalProfile } from './user.mapper';
import { toLocalPost } from './post.mapper';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly usersBaseUrl = `${environment.apiUrl}/users`;
  private readonly postsBaseUrl = `${environment.apiUrl}/posts`;

  async loadProfile(id: string): Promise<UserProfile | null> {
    try {
      const dto = await firstValueFrom(this.http.get<UserProfileDto>(`${this.usersBaseUrl}/${id}`));
      return toLocalProfile(dto);
    } catch {
      return null;
    }
  }

  async loadFriends(): Promise<UserProfile[]> {
    // UserSummaryDto has no bio/createdAt/etc. - fill with empty defaults via a minimal shim
    // (CurrentUserDto's broader shape isn't needed here, only id/username/name/avatar).
    const summaries = await firstValueFrom(
      this.http.get<
        {
          id: string;
          username: string;
          firstName: string;
          lastName: string;
          avatar?: { url: string };
        }[]
      >(`${this.usersBaseUrl}/me/friends`),
    );
    return summaries.map((summary) => ({
      id: summary.id,
      username: summary.username,
      email: '',
      firstName: summary.firstName,
      lastName: summary.lastName,
      avatarUrl: summary.avatar?.url ?? 'resources/person/men_1.png',
      coverUrl: 'resources/person/men_1.png',
      bio: '',
      memberSince: '',
    }));
  }

  /** All posts by `userId` (main-feed AND group posts both). */
  async loadPostsByAuthor(userId: string): Promise<Post[]> {
    const response = await firstValueFrom(
      this.http.get<PagedResponseDto<PostDto>>(`${this.postsBaseUrl}/by-author/${userId}`, {
        params: { page: 1, pageSize: 50 },
      }),
    );
    return response.items.map(toLocalPost);
  }
}
