import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../core/services/events.service';
import { MediaUploadService } from '../../core/services/media-upload.service';

@Component({
  selector: 'app-events',
  imports: [FormsModule],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {
  readonly formOpen = signal(false);
  readonly title = signal('');
  readonly description = signal('');
  readonly startsAt = signal('');
  readonly submitting = signal(false);
  readonly error = signal('');
  private selectedImage: File | undefined;

  constructor(
    readonly eventsService: EventsService,
    private readonly mediaUpload: MediaUploadService,
  ) {
    void this.eventsService.load();
  }

  async toggle(eventId: string): Promise<void> {
    await this.eventsService.toggleInterested(eventId);
  }

  openForm(): void {
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.resetForm();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImage = input.files?.[0];
  }

  async submit(): Promise<void> {
    const title = this.title().trim();
    const description = this.description().trim();
    const startsAt = this.startsAt();
    if (!title || !description || !startsAt) {
      this.error.set('Title, description and start date are required.');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    try {
      const imageAttachHandle = this.selectedImage
        ? (await this.mediaUpload.upload(this.selectedImage)).attachHandle
        : undefined;
      // datetime-local has no timezone - interpret it as local time, then send ISO (UTC).
      const startsAtIso = new Date(startsAt).toISOString();
      const ok = await this.eventsService.createEvent({
        title,
        description,
        startsAt: startsAtIso,
        imageAttachHandle,
      });
      if (ok) {
        this.formOpen.set(false);
        this.resetForm();
      } else {
        this.error.set('Could not create the event. Please try again.');
      }
    } finally {
      this.submitting.set(false);
    }
  }

  private resetForm(): void {
    this.title.set('');
    this.description.set('');
    this.startsAt.set('');
    this.selectedImage = undefined;
    this.error.set('');
  }
}
