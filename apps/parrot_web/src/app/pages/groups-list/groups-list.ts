import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GroupsService } from '../../core/services/groups.service';

@Component({
  selector: 'app-groups-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './groups-list.html',
  styleUrl: './groups-list.css',
})
export class GroupsList {
  readonly formOpen = signal(false);
  readonly name = signal('');
  readonly description = signal('');
  readonly submitting = signal(false);
  readonly error = signal('');

  constructor(readonly groupsService: GroupsService) {
    void this.groupsService.loadGroups();
  }

  toggle(groupId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    void this.groupsService.toggleMembership(groupId);
  }

  openForm(): void {
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.resetForm();
  }

  async submit(): Promise<void> {
    const name = this.name().trim();
    const description = this.description().trim();
    if (!name || !description) {
      this.error.set('Name and description are required.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    try {
      const ok = await this.groupsService.createGroup({ name, description });
      if (ok) {
        this.formOpen.set(false);
        this.resetForm();
      } else {
        this.error.set('Could not create the group. Please try again.');
      }
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm(): void {
    this.name.set('');
    this.description.set('');
    this.error.set('');
  }
}
