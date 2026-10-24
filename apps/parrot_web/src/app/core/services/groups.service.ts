import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CreateGroupRequestDto, GroupDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { Group } from '../models/group.model';
import { Post } from '../models/post.model';
import { toLocalPost } from './post.mapper';
import type { PagedResponseDto, PostDto } from '@parrot-social/shared-dto';

function toLocalGroup(dto: GroupDto): Group {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    memberCount: dto.memberCount,
    ownerId: dto.ownerId,
    ownerName: dto.ownerName,
    members: dto.members.map((member) => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
    })),
    joined: dto.joined,
  };
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/groups`;

  readonly groups = signal<Group[]>([]);
  readonly groupPosts = signal<Post[]>([]);

  async loadGroups(): Promise<void> {
    const dtos = await firstValueFrom(this.http.get<GroupDto[]>(this.baseUrl));
    this.groups.set(dtos.map(toLocalGroup));
  }

  getGroup(id: string): Group | undefined {
    return this.groups().find((group) => group.id === id);
  }

  /** Loads a single group's full detail directly from the backend - used by the group-detail
   * page so it works even without the list having been loaded first (e.g. direct navigation,
   * or a page refresh on /groups/:id). */
  async loadGroup(id: string): Promise<Group | null> {
    try {
      const dto = await firstValueFrom(this.http.get<GroupDto>(`${this.baseUrl}/${id}`));
      const group = toLocalGroup(dto);
      this.groups.update((groups) =>
        groups.some((g) => g.id === group.id)
          ? groups.map((g) => (g.id === group.id ? group : g))
          : [...groups, group],
      );
      return group;
    } catch {
      return null;
    }
  }

  async loadGroupPosts(groupId: string): Promise<void> {
    const response = await firstValueFrom(
      this.http.get<PagedResponseDto<PostDto>>(`${this.baseUrl}/${groupId}/posts`, {
        params: { page: 1, pageSize: 50 },
      }),
    );
    this.groupPosts.set(response.items.map(toLocalPost));
  }

  /** Returns true on success so the caller can clear/close its form. */
  async createGroup(request: CreateGroupRequestDto): Promise<boolean> {
    try {
      const dto = await firstValueFrom(this.http.post<GroupDto>(this.baseUrl, request));
      this.groups.update((groups) => [...groups, toLocalGroup(dto)]);
      return true;
    } catch {
      return false;
    }
  }

  async toggleMembership(groupId: string): Promise<void> {
    const group = this.getGroup(groupId);
    if (!group) return;
    try {
      const dto = group.joined
        ? await firstValueFrom(this.http.delete<GroupDto>(`${this.baseUrl}/${groupId}/join`))
        : await firstValueFrom(this.http.post<GroupDto>(`${this.baseUrl}/${groupId}/join`, {}));
      const updated = toLocalGroup(dto);
      this.groups.update((groups) => groups.map((g) => (g.id === updated.id ? updated : g)));
    } catch {
      // Owner-leave 400 or network error - no local state to roll back since we never mutated
      // optimistically. Caller may surface this via its own error state if desired.
    }
  }
}
