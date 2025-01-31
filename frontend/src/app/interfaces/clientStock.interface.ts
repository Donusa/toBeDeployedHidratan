import { Client } from "./client.interface";
import { Product } from "./product.interface";

export interface ClientStock {
  id: number;
  client: Client;
  product: Product;
  quantity: number;
}