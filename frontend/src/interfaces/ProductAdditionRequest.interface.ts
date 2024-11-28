import { Product } from "./product.interface";

export interface ProductAdditionRequest {
    product : Product;
    quantity : number;
}