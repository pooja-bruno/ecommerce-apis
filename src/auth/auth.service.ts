import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(private supabaseService: SupabaseService) {}

  async register(registerDto: RegisterDto) {
    const supabase = this.supabaseService.getClient();
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('ecommerce_user')
        .select('id')
        .eq('email', registerDto.email)
        .single();
      
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      
      // Generate a UUID for the user
      const userId = uuidv4();
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      
      // Insert user data into ecommerce_user table
      const { data, error } = await supabase
        .from('ecommerce_user')
        .insert({
          id: userId,
          name: registerDto.name,
          email: registerDto.email,
          password: hashedPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        this.logger.error(`Error inserting into ecommerce_user: ${error.message}`);
        throw new InternalServerErrorException('Error creating user');
      }
      
      // Create a simple token (not secure, just for testing)
      const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');
      
      return {
        user: {
          id: userId,
          name: registerDto.name,
          email: registerDto.email,
        },
        token,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Unexpected error during registration: ${error.message}`);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();
    
    try {
      // Find user by email
      const { data: user, error } = await supabase
        .from('ecommerce_user')
        .select('*')
        .eq('email', loginDto.email)
        .single();
      
      if (error || !user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // Create a simple token (not secure, just for testing)
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Unexpected error during login: ${error.message}`);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
} 