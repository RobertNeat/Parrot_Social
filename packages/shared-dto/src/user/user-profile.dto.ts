/** Public profile view of a user, as shown on their profile page to any viewer. */
export class UserProfileDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  work?: string;
  education?: string;
  relationship?: string;
  inhabitance?: string;
  provenance?: string;
  createdAt!: string;
}
