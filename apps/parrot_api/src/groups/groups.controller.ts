import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  GroupDto,
  PagedResponseDto,
  PostDto,
} from '@parrot-social/shared-dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { requireUuid } from '../common/validation.js';
import { toGroupDto } from './group.mapper.js';
import { GroupsRepository } from './groups.repository.js';
import { PostsRepository } from '../posts/posts.repository.js';
import { toPagedPostsDto } from '../posts/post.mapper.js';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groupsRepository: GroupsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  @Get()
  async list(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GroupDto[]> {
    const viewerId = userId(req);
    const rows = await this.groupsRepository.findAll(viewerId);
    const members = await this.groupsRepository.findMembersByGroupIds(
      rows.map((row) => row.id),
    );
    return Promise.all(
      rows.map(async (row) => {
        const ownerName = await this.groupsRepository.findOwnerName(
          row.owner_id,
        );
        return toGroupDto(
          row,
          ownerName ?? { firstName: '', lastName: '' },
          members.filter((member) => member.group_id === row.id),
          this.mediaRefBuilder,
          res,
        );
      }),
    );
  }

  @Get(':id')
  async getById(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GroupDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    return this.loadGroupDto(id, viewerId, res);
  }

  @Get(':id/posts')
  async listPosts(
    @Param('id') idRaw: string,
    @Query('page') pageRaw: string | undefined,
    @Query('pageSize') pageSizeRaw: string | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PagedResponseDto<PostDto>> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    const page = parsePositiveInt(pageRaw, 1);
    const pageSize = parsePositiveInt(pageSizeRaw, 20);

    const { rows, totalCount } = await this.postsRepository.findByGroup(
      id,
      viewerId,
      page,
      pageSize,
    );
    return toPagedPostsDto(
      this.postsRepository,
      rows,
      totalCount,
      page,
      pageSize,
      this.mediaRefBuilder,
      res,
    );
  }

  @Post(':id/join')
  async join(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GroupDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    await this.groupsRepository.join(id, viewerId);
    return this.loadGroupDto(id, viewerId, res);
  }

  @Delete(':id/join')
  async leave(
    @Param('id') idRaw: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GroupDto> {
    const id = requireUuid(idRaw, 'id');
    const viewerId = userId(req);
    await this.ensureExists(id);
    const ownerId = await this.groupsRepository.getOwnerId(id);
    if (ownerId === viewerId) {
      throw new BadRequestException('Group owner cannot leave their own group');
    }
    await this.groupsRepository.leave(id, viewerId);
    return this.loadGroupDto(id, viewerId, res);
  }

  private async ensureExists(groupId: string): Promise<void> {
    if (!(await this.groupsRepository.exists(groupId))) {
      throw new NotFoundException('Group not found');
    }
  }

  private async loadGroupDto(
    groupId: string,
    viewerId: string,
    res: Response,
  ): Promise<GroupDto> {
    const row = await this.groupsRepository.findById(groupId, viewerId);
    if (!row) {
      throw new NotFoundException('Group not found');
    }
    const [ownerName, members] = await Promise.all([
      this.groupsRepository.findOwnerName(row.owner_id),
      this.groupsRepository.findMembersByGroupIds([groupId]),
    ]);
    return toGroupDto(
      row,
      ownerName ?? { firstName: '', lastName: '' },
      members,
      this.mediaRefBuilder,
      res,
    );
  }
}

function userId(req: Request): string {
  return (req as Request & { user: { id: string } }).user.id;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
