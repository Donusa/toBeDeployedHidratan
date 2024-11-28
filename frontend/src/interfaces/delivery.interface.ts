import { Client } from "./client.interface";
import { Product } from "./product.interface";

export interface Delivery {
  id?: number;
  client: Client;
  assignedTo: string;
  status: string;
  deliveryDate: string;
  products: Product[];
} 

