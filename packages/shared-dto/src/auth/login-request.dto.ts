export class LoginRequestDto {
  /** Username or email, resolved by the backend. */
  identifier!: string;
  password!: string;
}
