import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(private supabaseService: SupabaseService) {}

  async getCart(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('ecommerce_cart_items')
      .select(`
        *,
        product:ecommerce_products(*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Error fetching cart: ${error.message}`);
    }
    
    return data;
  }

  async addToCart(addToCartDto: AddToCartDto) {
    const supabase = this.supabaseService.getClient();
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('ecommerce_products')
      .select('id, stock')
      .eq('id', addToCartDto.productId)
      .single();
    
    if (productError || !product) {
      throw new NotFoundException(`Product not found`);
    }
    
    // Check if product is in stock
    if (product.stock !== null && product.stock < addToCartDto.quantity) {
      throw new Error(`Not enough stock available`);
    }
    
    // Check if item already exists in cart
    const { data: existingItem, error: existingItemError } = await supabase
      .from('ecommerce_cart_items')
      .select('*')
      .eq('user_id', addToCartDto.userId)
      .eq('product_id', addToCartDto.productId)
      .single();
    
    if (existingItem) {
      // Update quantity if item already exists
      const newQuantity = existingItem.quantity + addToCartDto.quantity;
      
      const { data, error } = await supabase
        .from('ecommerce_cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Error updating cart item: ${error.message}`);
      }
      
      return data;
    } else {
      // Add new item to cart
      const cartItemId = uuidv4();
      
      const { data, error } = await supabase
        .from('ecommerce_cart_items')
        .insert({
          id: cartItemId,
          user_id: addToCartDto.userId,
          product_id: addToCartDto.productId,
          quantity: addToCartDto.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Error adding to cart: ${error.message}`);
      }
      
      return data;
    }
  }

  async updateCartItem(itemId: string, updateCartItemDto: UpdateCartItemDto) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('ecommerce_cart_items')
      .update({
        quantity: updateCartItemDto.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating cart item: ${error.message}`);
    }
    
    if (!data) {
      throw new NotFoundException(`Cart item not found`);
    }
    
    return data;
  }

  async removeFromCart(itemId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('ecommerce_cart_items')
      .delete()
      .eq('id', itemId);
    
    if (error) {
      throw new Error(`Error removing from cart: ${error.message}`);
    }
    
    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { error } = await supabase
      .from('ecommerce_cart_items')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Error clearing cart: ${error.message}`);
    }
    
    return { message: 'Cart cleared successfully' };
  }
} 