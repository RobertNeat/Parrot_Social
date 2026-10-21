import type { Response } from 'express';
import type { EventDto } from '@parrot-social/shared-dto';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import type { EventRow } from './events.repository.js';

export async function toEventDto(
  row: EventRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<EventDto> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image: await mediaRefBuilder.buildRefForMediaId(row.image_media_id, res),
    startsAt: row.starts_at.toISOString(),
    interestedCount: row.interested_count,
    interested: row.interested,
  };
}
