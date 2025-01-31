import { DelivererStock } from './delivererStock.interface';

export interface Deliverer {
    id?: string;
    email: string;
    password?: string;
    name: string;
    role: string;
    active: boolean;
    products: DelivererStock[];
    dailyEarnings?: number;
    resetToken?: string;
    resetTokenExpiry?: Date;
} 