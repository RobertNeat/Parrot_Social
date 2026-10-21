import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { SearchResultDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { Post } from '../models/post.model';
import { toLocalPost } from './post.mapper';
import type { UserSummaryDto } from '@parrot-social/shared-dto';

export interface SearchResult {
  users: UserSummaryDto[];
  posts: Post[];
}

const EMPTY_RESULT: SearchResult = { users: [], posts: [] };

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/search`;

  readonly result = signal<SearchResult>(EMPTY_RESULT);
  readonly loading = signal(false);

  async search(query: string): Promise<void> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      this.result.set(EMPTY_RESULT);
      return;
    }

    this.loading.set(true);
    try {
      const dto = await firstValueFrom(
        this.http.get<SearchResultDto>(this.baseUrl, { params: { q: trimmed } }),
      );
      this.result.set({
        users: dto.users,
        posts: dto.posts.map(toLocalPost),
      });
    } catch {
      this.result.set(EMPTY_RESULT);
    } finally {
      this.loading.set(false);
    }
  }
}
