import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CreateEventRequestDto, EventDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { EventItem } from '../models/event.model';

function toLocalEvent(dto: EventDto): EventItem {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    imageUrl: dto.image?.url,
    startsAt: dto.startsAt,
    location: dto.location,
    organizerId: dto.organizerId,
    organizerName: dto.organizerName,
    interestedCount: dto.interestedCount,
    interested: dto.interested,
  };
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/events`;

  readonly events = signal<EventItem[]>([]);

  async load(): Promise<void> {
    const dtos = await firstValueFrom(this.http.get<EventDto[]>(this.baseUrl));
    this.events.set(dtos.map(toLocalEvent));
  }

  getEvent(id: string): EventItem | undefined {
    return this.events().find((event) => event.id === id);
  }

  /** Loads a single event's full detail directly from the backend - used by the event-detail
   * page so it works even without the list having been loaded first (e.g. direct navigation,
   * or a page refresh on /events/:id). */
  async loadEvent(id: string): Promise<EventItem | null> {
    try {
      const dto = await firstValueFrom(this.http.get<EventDto>(`${this.baseUrl}/${id}`));
      const event = toLocalEvent(dto);
      this.events.update((events) =>
        events.some((e) => e.id === event.id)
          ? events.map((e) => (e.id === event.id ? event : e))
          : [...events, event],
      );
      return event;
    } catch {
      return null;
    }
  }

  /** Returns true on success so the caller can clear/close its form. */
  async createEvent(request: CreateEventRequestDto): Promise<boolean> {
    try {
      const dto = await firstValueFrom(this.http.post<EventDto>(this.baseUrl, request));
      this.events.update((events) => [...events, toLocalEvent(dto)]);
      return true;
    } catch {
      return false;
    }
  }

  async toggleInterested(eventId: string): Promise<void> {
    const event = this.events().find((e) => e.id === eventId);
    if (!event) return;
    try {
      const dto = event.interested
        ? await firstValueFrom(this.http.delete<EventDto>(`${this.baseUrl}/${eventId}/interested`))
        : await firstValueFrom(
            this.http.post<EventDto>(`${this.baseUrl}/${eventId}/interested`, {}),
          );
      const updated = toLocalEvent(dto);
      this.events.update((events) => events.map((e) => (e.id === updated.id ? updated : e)));
    } catch {
      // Network error or 404 - no optimistic mutation was made, so no rollback needed.
    }
  }
}
