import type { Response } from 'express';
import type {
  CurrentUserDto,
  UserProfileDto,
  UserSummaryDto,
} from '@parrot-social/shared-dto';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import type { UserRow } from './users.repository.js';

async function buildProfileFields(
  row: UserRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<UserProfileDto> {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: await mediaRefBuilder.buildRefForMediaId(row.avatar_media_id, res),
    cover: await mediaRefBuilder.buildRefForMediaId(row.cover_media_id, res),
    bio: row.bio ?? undefined,
    work: row.work ?? undefined,
    education: row.education ?? undefined,
    relationship: row.relationship ?? undefined,
    inhabitance: row.inhabitance ?? undefined,
    provenance: row.provenance ?? undefined,
    createdAt: row.created_at.toISOString(),
  };
}

export function toUserProfileDto(
  row: UserRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<UserProfileDto> {
  return buildProfileFields(row, mediaRefBuilder, res);
}

/** Minimal denormalized profile fields for author/contact/member display lists. */
export async function toUserSummaryDto(
  row: UserRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<UserSummaryDto> {
  return {
    id: row.id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    avatar: await mediaRefBuilder.buildRefForMediaId(row.avatar_media_id, res),
  };
}

export async function toCurrentUserDto(
  row: UserRow,
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<CurrentUserDto> {
  const profile = await buildProfileFields(row, mediaRefBuilder, res);
  return Object.assign(profile, { email: row.email }) as CurrentUserDto;
}
