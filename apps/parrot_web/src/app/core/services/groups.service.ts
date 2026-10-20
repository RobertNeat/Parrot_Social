import { Injectable, signal } from '@angular/core';
import { Group } from '../models/group.model';
import { Post } from '../models/post.model';
import { GROUPS, GROUP_POSTS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class GroupsService {
  readonly groups = signal<Group[]>(
    GROUPS.map((group) => ({ ...group, members: [...group.members] })),
  );
  readonly groupPosts = signal<Post[]>(
    GROUP_POSTS.map((post) => ({ ...post, comments: [...post.comments] })),
  );

  getGroup(id: string): Group | undefined {
    return this.groups().find((group) => group.id === id);
  }

  toggleMembership(groupId: string): void {
    this.groups.update((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              joined: !group.joined,
              memberCount: group.memberCount + (group.joined ? -1 : 1),
            }
          : group,
      ),
    );
  }
}
