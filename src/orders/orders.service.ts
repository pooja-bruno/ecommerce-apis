import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private supabaseService: SupabaseService,
    private cartService: CartService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    const supabase = this.supabaseService.getClient();
    
    // Get cart items
    const cartItems = await this.cartService.getCart(createOrderDto.userId);
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    
    // Calculate total
    let total = 0;
    for (const item of cartItems) {
      total += item.product.price * item.quantity;
    }
    
    // Create order
    const orderId = uuidv4();
    
    const { data: order, error: orderError } = await supabase
      .from('ecommerce_orders')
      .insert({
        id: orderId,
        user_id: createOrderDto.userId,
        total,
        status: 'pending',
        shipping_address: createOrderDto.shippingAddress,
        payment_method: createOrderDto.paymentMethod,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (orderError) {
      throw new Error(`Error creating order: ${orderError.message}`);
    }
    
    // Create order items
    const orderItems = cartItems.map(item => ({
      id: uuidv4(),
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product.price,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    const { error: orderItemsError } = await supabase
      .from('ecommerce_order_items')
      .insert(orderItems);
    
    if (orderItemsError) {
      throw new Error(`Error creating order items: ${orderItemsError.message}`);
    }
    
    // Update product stock
    for (const item of cartItems) {
      if (item.product.stock !== null) {
        const newStock = item.product.stock - item.quantity;
        
        const { error: stockError } = await supabase
          .from('ecommerce_products')
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq('id', item.product_id);
        
        if (stockError) {
          throw new Error(`Error updating product stock: ${stockError.message}`);
        }
      }
    }
    
    // Clear cart
    await this.cartService.clearCart(createOrderDto.userId);
    
    return {
      ...order,
      items: orderItems,
    };
  }

  async getUserOrders(userId: string) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('ecommerce_orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }
    
    return data;
  }

  async getOrderById(id: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('ecommerce_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (orderError || !order) {
      throw new NotFoundException(`Order not found`);
    }
    
    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('ecommerce_order_items')
      .select(`
        *,
        product:ecommerce_products(*)
      `)
      .eq('order_id', id);
    
    if (itemsError) {
      throw new Error(`Error fetching order items: ${itemsError.message}`);
    }
    
    return {
      ...order,
      items: orderItems,
    };
  }
} 