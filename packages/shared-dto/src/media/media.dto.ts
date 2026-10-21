/** The on-disk random file name/path is backend-internal; `id` is the only stable reference exposed. */
export class MediaDto {
  id!: string;
  url!: string;
  originalFileName!: string;
  mimeType!: string;
  size!: number;
  createdAt!: string;
}
