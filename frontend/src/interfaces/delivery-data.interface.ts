import { Product } from './product.interface';

export interface DeliveryData {
  clientName: string;
  address: string;
  status: string;
  assignedTo: string;
  debt: number;
  hasStock: boolean;
  nextVisit: Date;
  products: Product[];
} 