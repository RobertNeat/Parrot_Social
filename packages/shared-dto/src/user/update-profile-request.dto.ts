export class UpdateProfileRequestDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
  relationship?: string;
  inhabitance?: string;
  education?: string;
  provenance?: string;
  work?: string;
  /** MediaDto.attachHandle from a prior upload; omit to leave the current avatar unchanged. */
  avatarAttachHandle?: string;
  /** MediaDto.attachHandle from a prior upload; omit to leave the current cover image unchanged. */
  coverAttachHandle?: string;
}
