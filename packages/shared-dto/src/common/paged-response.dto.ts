export class PagedResponseDto<T> {
  items!: T[];
  page!: number;
  pageSize!: number;
  totalCount!: number;
}
