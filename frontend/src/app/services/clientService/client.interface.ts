export interface Client {
  id?: number;
  name: string;
  address: string;
  debt: number;
  nextVisit: Date;
  products: ClientProduct[];
}

export interface ClientProduct {
  id: number;
  name: string;
  stock: number;
  minStock?: number;
} 