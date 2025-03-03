import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { SupabaseAuthGuard } from '../supabase/guards/supabase-auth.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('add')
  async addToCart(@Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(addToCartDto);
  }

  @Post('update/:itemId')
  async updateCartItem(
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(itemId, updateCartItemDto);
  }

  @Delete('remove/:itemId')
  async removeFromCart(@Param('itemId') itemId: string) {
    return this.cartService.removeFromCart(itemId);
  }

  @Delete('clear/:userId')
  async clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
} 