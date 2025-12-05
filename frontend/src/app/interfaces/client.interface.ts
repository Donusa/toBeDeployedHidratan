import { Product } from './product.interface';

export interface ClientStock {
    id: number;
    product: Product;
    quantity: number;
}

export interface Client {
    id: number;
    address: string;
    frecuency: number;
    debt: number;
    phoneNumber: string;
    zone?: string;
    observations?: string;
    clientStock: ClientStock[];
}
