import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private cartService: CartService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
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
    const order = this.orderRepository.create({
      userId: createOrderDto.userId,
      total,
      status: 'pending',
      shippingAddress: createOrderDto.shippingAddress,
      paymentMethod: createOrderDto.paymentMethod,
    });
    
    const savedOrder = await this.orderRepository.save(order);
    
    // Create order items
    const orderItems = await Promise.all(
      cartItems.map(async (item) => {
        const orderItem = this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        });
        return this.orderItemRepository.save(orderItem);
      })
    );
    
    // Clear cart
    await this.cartService.clearCart(createOrderDto.userId);
    
    return {
      ...savedOrder,
      items: orderItems,
    };
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(id: string) {
    // Get order
    const order = await this.orderRepository.findOne({
      where: { id }
    });
    
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    
    // Get order items
    const orderItems = await this.orderItemRepository.find({
      where: { orderId: id },
      relations: ['product'],
    });
    
    return {
      ...order,
      items: orderItems,
    };
  }
} 