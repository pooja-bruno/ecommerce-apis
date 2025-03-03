import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, Put } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { SimpleAuthGuard } from '../auth/guards/simple-auth.guard';

@Controller('cart')
@UseGuards(SimpleAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartService.getCart(req.user.id);
  }

  @Post('add')
  addToCart(@Body() addToCartDto: AddToCartDto, @Req() req) {
    addToCartDto.userId = req.user.id;
    return this.cartService.addToCart(addToCartDto);
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