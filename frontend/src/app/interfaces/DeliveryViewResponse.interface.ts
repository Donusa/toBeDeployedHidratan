export interface DeliveryViewResponse {
  client: {
    id: number;
    address: string;
    frecuency: number;
    debt: number;
    phoneNumber: string;
    clientStock: any[];
  };
  deliverId: number;
  delivererName: string;
  delivererEmail: string;
  status: string;
  deliveryDate: string;
} 