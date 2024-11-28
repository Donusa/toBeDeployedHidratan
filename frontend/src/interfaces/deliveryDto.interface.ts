import { DeliveryProductDto } from "./deliveryProductDto.interface";

export interface DeliveryDto {
id:number;
deliveryDate:string;
status:string;
deliveryManEmail:string;
clientName:string;
address:string;
deliveryProducts:DeliveryProductDto[];
}