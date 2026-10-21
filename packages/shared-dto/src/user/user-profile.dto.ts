import { MediaRefDto } from '../media/media.dto.js';

/** Public profile view of a user, as shown on their profile page to any viewer. */
export class UserProfileDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  avatar?: MediaRefDto;
  cover?: MediaRefDto;
  bio?: string;
  work?: string;
  education?: string;
  relationship?: string;
  inhabitance?: string;
  provenance?: string;
  createdAt!: string;
}
