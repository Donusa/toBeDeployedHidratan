export interface StockHistory {
  date: Date;
  totalValue: number;
  productCount?: number;
  lowStockCount?: number;
  description?: string;
} 