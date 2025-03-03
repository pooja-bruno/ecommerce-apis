import { Injectable, ConflictException, UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({ 
        where: { email: registerDto.email } 
      });
      
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      
      // Create new user
      const user = this.userRepository.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
      });
      
      // Save user to database
      const savedUser = await this.userRepository.save(user);
      
      // Create a simple token (not secure, just for testing)
      const token = Buffer.from(`${savedUser.id}:${Date.now()}`).toString('base64');
      
      return {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
        },
        token,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Unexpected error during registration: ${error.message}`);
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({ 
        where: { email: loginDto.email } 
      });
      
      if (!user) {
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