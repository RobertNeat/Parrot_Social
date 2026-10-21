import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import type {
  AuthResponseDto,
  JwtPayloadDto,
  LoginRequestDto,
  RegisterRequestDto,
} from '@parrot-social/shared-dto';
import { UsersRepository } from '../users/users.repository.js';
import { toCurrentUserDto } from '../users/user.mapper.js';
import { MediaRefBuilderService } from '../media/media-ref-builder.service.js';
import { requireString } from '../common/validation.js';
import { hashPassword, verifyPassword } from './password.util.js';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1h
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly mediaRefBuilder: MediaRefBuilderService,
  ) {}

  async login(dto: LoginRequestDto, res: Response): Promise<AuthResponseDto> {
    const identifier = requireString(dto.identifier, 'identifier');
    const password = requireString(dto.password, 'password');
    const row = await this.usersRepository.findByIdentifier(identifier);
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(row, res);
  }

  async register(
    dto: RegisterRequestDto,
    res: Response,
  ): Promise<AuthResponseDto> {
    const username = requireString(dto.username, 'username', {
      minLength: 1,
      maxLength: 64,
    });
    const email = requireString(dto.email, 'email', { maxLength: 255 });
    if (!EMAIL_RE.test(email)) {
      throw new BadRequestException('email must be a valid email address');
    }
    const password = requireString(dto.password, 'password', {
      minLength: 6,
    });

    const taken = await this.usersRepository.usernameOrEmailTaken(
      username,
      email,
    );
    if (taken) {
      throw new ConflictException('Username or email already in use');
    }
    const passwordHash = await hashPassword(password);
    const row = await this.usersRepository.create({
      username,
      email,
      passwordHash,
      firstName: username,
      lastName: '',
    });
    return this.buildAuthResponse(row, res);
  }

  async me(userId: string, res: Response): Promise<AuthResponseDto['user']> {
    const row = await this.usersRepository.findById(userId);
    if (!row) {
      throw new UnauthorizedException('User no longer exists');
    }
    return toCurrentUserDto(row, this.mediaRefBuilder, res);
  }

  private async buildAuthResponse(
    row: Parameters<typeof toCurrentUserDto>[0],
    res: Response,
  ): Promise<AuthResponseDto> {
    const payload: Pick<JwtPayloadDto, 'sub' | 'username'> = {
      sub: row.id,
      username: row.username,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: await toCurrentUserDto(row, this.mediaRefBuilder, res),
    };
  }
}
