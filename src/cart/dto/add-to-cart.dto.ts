import { IsNotEmpty, IsUUID, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
} 