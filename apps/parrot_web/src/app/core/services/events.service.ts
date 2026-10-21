import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { CreateEventRequestDto, EventDto } from '@parrot-social/shared-dto';
import { environment } from '../../../environments/environment';
import { EventItem } from '../models/event.model';

// No seed event currently has a real image_media_id - this is a genuine "no image" fallback,
// not seed-data variety (unlike avatar/post media), so a single static placeholder is enough.
const FALLBACK_EVENT_IMAGE = 'resources/event/event_1.png';

function toLocalEvent(dto: EventDto): EventItem {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    imageUrl: dto.image?.url ?? FALLBACK_EVENT_IMAGE,
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
