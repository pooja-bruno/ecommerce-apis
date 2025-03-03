import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Decode the simple token
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      
      // Get user data from ecommerce-user table
      const supabase = this.supabaseService.getClient();
      const { data: user, error } = await supabase
        .from('ecommerce_user')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }
      
      // Attach the user to the request
      request.user = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
} 