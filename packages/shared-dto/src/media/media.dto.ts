/** Returned by the upload endpoint; `attachHandle` (never the DB id) is what request DTOs reference. */
export class MediaDto {
  attachHandle!: string;
  originalFileName!: string;
  mimeType!: string;
  size!: number;
  createdAt!: string;
}

/** Embedded wherever a response needs a fetchable image: the backend mints this when it builds the
 * response, so the client never learns the underlying media id, only a one-time stream URL. */
export class MediaRefDto {
  url!: string;
  expiresAt!: string;
}

/** Client-requested refresh of an expired/consumed MediaRefDto, by the same opaque attachHandle used on upload. */
export class RefreshMediaRefRequestDto {
  attachHandles!: string[];
}

export class RefreshMediaRefResponseDto {
  refs!: Record<string, MediaRefDto>;
}
