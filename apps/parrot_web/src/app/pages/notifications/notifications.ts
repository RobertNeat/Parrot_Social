import { Component } from '@angular/core';
import { NotificationsService } from '../../core/services/notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications {
  constructor(readonly notifications: NotificationsService) {
    void this.notifications.load();
  }
}
