export interface DeliveryReport {
    id: number;
    deliveryDate: string;
    status: string;
    address: string;
    phoneNumber: string;
    debt: number;
    totalReturnableProducts: number;
} 