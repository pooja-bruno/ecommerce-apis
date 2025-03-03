import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProductsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(category?: string) {
    const supabase = this.supabaseService.getClient();
    
    let query = supabase.from('ecommerce_products').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
    
    return data;
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('ecommerce_products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return data;
  }
} 