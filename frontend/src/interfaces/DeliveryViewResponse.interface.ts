import { Client } from "./client.interface";

export interface DeliveryViewResponse {
  deliverId: number;
  client: Client;
  delivererName: string;
  delivererEmail: string;
  status: string;
  deliveryDate: string;
}
