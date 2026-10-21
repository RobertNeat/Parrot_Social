import { CurrentUserDto } from '../user/current-user.dto.js';

export class AuthResponseDto {
  accessToken!: string;
  tokenType!: 'Bearer';
  expiresIn!: number;
  user!: CurrentUserDto;
}
