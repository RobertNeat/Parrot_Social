export class UpdateProfileRequestDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
  relationship?: string;
  inhabitance?: string;
  education?: string;
  provenance?: string;
  work?: string;
  /** References a previously uploaded MediaDto.id; omit to leave the current avatar unchanged. */
  avatarMediaId?: string;
  /** References a previously uploaded MediaDto.id; omit to leave the current cover image unchanged. */
  coverMediaId?: string;
}
