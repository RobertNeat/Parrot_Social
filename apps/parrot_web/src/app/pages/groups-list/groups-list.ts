import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GroupsService } from '../../core/services/groups.service';

@Component({
  selector: 'app-groups-list',
  imports: [RouterLink],
  templateUrl: './groups-list.html',
  styleUrl: './groups-list.css',
})
export class GroupsList {
  constructor(readonly groupsService: GroupsService) {}

  toggle(groupId: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.groupsService.toggleMembership(groupId);
  }
}
