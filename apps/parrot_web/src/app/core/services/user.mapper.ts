import type { CurrentUserDto, UserProfileDto } from '@parrot-social/shared-dto';
import { UserProfile } from '../models/user.model';

const FALLBACK_AVATAR = 'resources/person/men_1.png';

/** Maps the real profile DTO shape (UserProfileDto or the CurrentUserDto that extends it with
 * email) to the local UserProfile model used by Profile/Settings/shell pages. `email` is only
 * present on CurrentUserDto (another user's profile never exposes it), so it defaults to ''. */
export function toLocalProfile(dto: UserProfileDto | CurrentUserDto): UserProfile {
  return {
    id: dto.id,
    username: dto.username,
    email: 'email' in dto ? dto.email : '',
    firstName: dto.firstName,
    lastName: dto.lastName,
    avatarUrl: dto.avatar?.url ?? FALLBACK_AVATAR,
    coverUrl: dto.cover?.url ?? FALLBACK_AVATAR,
    bio: dto.bio ?? '',
    work: dto.work,
    education: dto.education,
    relationship: dto.relationship,
    inhabitance: dto.inhabitance,
    provenance: dto.provenance,
    memberSince: new Date(dto.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}
