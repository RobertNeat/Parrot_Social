import type { Response } from 'express';
import type { GroupDto, GroupSummaryDto } from '@parrot-social/shared-dto';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import type { GroupMemberRow, GroupSummaryRow } from './groups.repository.js';

export function toGroupSummaryDto(row: GroupSummaryRow): GroupSummaryDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    memberCount: row.member_count,
  };
}

export async function toGroupDto(
  row: GroupSummaryRow,
  ownerName: { firstName: string; lastName: string },
  members: GroupMemberRow[],
  mediaRefBuilder: MediaRefBuilderService,
  res: Response,
): Promise<GroupDto> {
  const summary = toGroupSummaryDto(row);
  return {
    id: summary.id,
    name: summary.name,
    description: summary.description,
    memberCount: summary.memberCount,
    ownerId: row.owner_id,
    ownerName: `${ownerName.firstName} ${ownerName.lastName}`,
    joined: row.joined,
    members: await Promise.all(
      members.map(async (member) => ({
        id: member.id,
        username: member.username,
        firstName: member.first_name,
        lastName: member.last_name,
        avatar: await mediaRefBuilder.buildRefForMediaId(
          member.avatar_media_id,
          res,
        ),
      })),
    ),
  };
}
