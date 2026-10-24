import { MediaRefDto } from '../media/media.dto.js';

export class EventDto {
  id!: string;
  title!: string;
  description!: string;
  image?: MediaRefDto;
  startsAt!: string;
  location?: string | null;
  organizerId!: string;
  organizerName!: string;
  interestedCount!: number;
  /** Viewer-relative: whether the requesting user marked themself interested. */
  interested!: boolean;
}

export class CreateEventRequestDto {
  title!: string;
  description!: string;
  startsAt!: string;
  location?: string;
  /** MediaDto.attachHandle from a prior upload. */
  imageAttachHandle?: string;
}
