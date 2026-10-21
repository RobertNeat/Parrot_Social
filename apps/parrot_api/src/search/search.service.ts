import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { SearchResultDto } from '@parrot-social/shared-dto';
import { escapeLikePattern } from '../common/validation.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { PostsRepository } from '../posts/posts.repository.js';
import { toPostDto } from '../posts/post.mapper.js';
import { UsersRepository } from '../users/users.repository.js';
import { toUserSummaryDto } from '../users/user.mapper.js';

const RESULT_LIMIT = 20;

@Injectable()
export class SearchService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly postsRepository: PostsRepository,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  async search(
    query: string,
    viewerId: string,
    res: Response,
  ): Promise<SearchResultDto> {
    const likePattern = `%${escapeLikePattern(query)}%`;

    const [userRows, postRows] = await Promise.all([
      this.usersRepository.search(likePattern, RESULT_LIMIT),
      this.postsRepository.search(viewerId, likePattern, RESULT_LIMIT),
    ]);

    const postIds = postRows.map((row) => row.id);
    const comments = await this.postsRepository.findCommentsByPostIds(postIds);

    const [users, posts] = await Promise.all([
      Promise.all(
        userRows.map((row) => toUserSummaryDto(row, this.mediaRefBuilder, res)),
      ),
      Promise.all(
        postRows.map((row) =>
          toPostDto(
            row,
            comments.filter((comment) => comment.post_id === row.id),
            this.mediaRefBuilder,
            res,
          ),
        ),
      ),
    ]);

    return { users, posts };
  }
}
