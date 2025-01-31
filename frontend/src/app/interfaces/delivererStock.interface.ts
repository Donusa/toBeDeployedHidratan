import { Product } from './product.interface';
import { AppUserResponse } from './appUserResponse.interface';

export interface DelivererStock {
  id: number;
  deliveryMan: AppUserResponse;
  product: Product;
  quantity: number;
} 