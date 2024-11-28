import { Product } from "./product.interface";

export interface Client {
  id?: number;
  name: string;
  address: string;
  debt: number;
  frecuency: number;
  nextVisit?: string | null;
  clientProducts: ClientProduct[];
}

export interface ClientProduct {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
}