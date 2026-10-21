import { MediaRefDto } from '../media/media.dto.js';

/** Minimal, publicly visible user data used for denormalized author/contact/member display. */
export class UserSummaryDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  avatar?: MediaRefDto;
}
