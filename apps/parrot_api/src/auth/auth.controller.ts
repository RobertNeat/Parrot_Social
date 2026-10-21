import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type {
  AuthResponseDto,
  CurrentUserDto,
  LoginRequestDto,
  RegisterRequestDto,
} from '@parrot-social/shared-dto';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.login(body, res);
  }

  @Post('register')
  register(
    @Body() body: RegisterRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.authService.register(body, res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CurrentUserDto> {
    const userId = (req as Request & { user: { id: string } }).user.id;
    return this.authService.me(userId, res);
  }
}
