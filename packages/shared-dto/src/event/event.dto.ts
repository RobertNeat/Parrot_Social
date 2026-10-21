export class EventDto {
  id!: string;
  title!: string;
  description!: string;
  imageUrl?: string;
  startsAt!: string;
  interestedCount!: number;
  /** Viewer-relative: whether the requesting user marked themself interested. */
  interested!: boolean;
}

export class CreateEventRequestDto {
  title!: string;
  description!: string;
  startsAt!: string;
  /** References a previously uploaded MediaDto.id. */
  imageMediaId?: string;
}
