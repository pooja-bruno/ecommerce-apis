import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  shippingAddress: string;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;
} 