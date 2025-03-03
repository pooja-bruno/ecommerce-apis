import { Controller, Post, Body, Get, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SupabaseAuthGuard } from '../supabase/guards/supabase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error registering user', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error logging in', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return req.user;
  }
} 