import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { EventsService } from '../../core/services/events.service';
import { EventItem } from '../../core/models/event.model';

@Component({
  selector: 'app-event-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './event-page.html',
  styleUrl: './event-page.css',
})
export class EventPage {
  readonly eventsService = inject(EventsService);
  private readonly route = inject(ActivatedRoute);

  readonly event = signal<EventItem | undefined>(undefined);
  private loadingId: string | null = null;

  constructor() {
    // Angular reuses this component instance across /events/x -> /events/y navigations, so
    // reload whenever the route id changes rather than once at construction time.
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      void this.doLoad(id);
    });
  }

  private async doLoad(id: string): Promise<void> {
    if (!id || id === this.loadingId) return;
    this.loadingId = id;
    const event = await this.eventsService.loadEvent(id);
    if (this.loadingId !== id) return; // stale response - a newer navigation already started
    this.event.set(event ?? undefined);
  }

  async toggle(): Promise<void> {
    const event = this.event();
    if (!event) return;
    await this.eventsService.toggleInterested(event.id);
    this.event.set(this.eventsService.getEvent(event.id));
  }
}
