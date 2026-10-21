import { UserProfileDto } from './user-profile.dto.js';

/** Full session user data, returned only to the authenticated user themself (includes email). */
export class CurrentUserDto extends UserProfileDto {
  email!: string;
}
