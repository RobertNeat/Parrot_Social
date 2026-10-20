import { Component } from '@angular/core';
import { EventsService } from '../../core/services/events.service';

@Component({
  selector: 'app-events',
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {
  constructor(readonly eventsService: EventsService) {}

  toggle(eventId: string): void {
    this.eventsService.toggleInterested(eventId);
  }
}
