import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Put, Logger } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { SimpleAuthGuard } from '../auth/guards/simple-auth.guard';

@Controller('cart')
@UseGuards(SimpleAuthGuard)
export class CartController {
  private readonly logger = new Logger(CartController.name);
  
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('add')
  addToCart(@Body() addToCartDto: AddToCartDto, @Req() req) {
    // Log the user ID for debugging
    this.logger.debug(`Adding to cart for user: ${req.user.id}`);
    
    // Pass the user ID separately to the service
    return this.cartService.addToCart(addToCartDto, req.user.id);
  }

  @Put(':id')
  updateCartItem(
    @Param('id') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    return this.cartService.updateCartItem(itemId, updateCartItemDto);
  }

  @Delete(':id')
  removeFromCart(@Param('id') itemId: string) {
    return this.cartService.removeFromCart(itemId);
  }

  @Delete()
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
  }
} 