import { UserSummaryDto } from '../user/user-summary.dto.js';
import { PostDto } from '../post/post.dto.js';

export class SearchRequestDto {
  query!: string;
}

export class SearchResultDto {
  users!: UserSummaryDto[];
  posts!: PostDto[];
}
