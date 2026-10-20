import { Injectable, signal } from '@angular/core';
import { EventItem } from '../models/event.model';
import { EVENTS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class EventsService {
  readonly events = signal<EventItem[]>(EVENTS.map((event) => ({ ...event })));

  toggleInterested(eventId: string): void {
    this.events.update((events) =>
      events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              interested: !event.interested,
              interestedCount: event.interestedCount + (event.interested ? -1 : 1),
            }
          : event,
      ),
    );
  }
}
