import { UserSummaryDto } from '../user/user-summary.dto.js';

export class GroupSummaryDto {
  id!: string;
  name!: string;
  description!: string;
  memberCount!: number;
}

export class GroupDto extends GroupSummaryDto {
  ownerId!: string;
  ownerName!: string;
  members!: UserSummaryDto[];
  /** Viewer-relative: whether the requesting user is a member of this group. */
  joined!: boolean;
}

export class CreateGroupRequestDto {
  name!: string;
  description!: string;
}
