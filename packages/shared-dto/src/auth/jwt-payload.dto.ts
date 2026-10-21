/** Shape of the decoded JWT access token payload, shared so both sides agree on claim names. */
export class JwtPayloadDto {
  sub!: string;
  username!: string;
  iat!: number;
  exp!: number;
}
