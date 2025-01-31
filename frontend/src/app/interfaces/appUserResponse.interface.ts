import { DelivererStock } from './delivererStock.interface';

export interface AppUserResponse {
    email: string;
    name: string;
    role: string;
    active: boolean;
    products: DelivererStock[];
} 