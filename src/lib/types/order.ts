import type { PaymentMethod } from "./payment";

export interface OrderListItem {
  id: number;
  placedDate: string;
  total: number;
  currencyCode: string;
  payment: PaymentMethod;
  productSummary: string;
}

export interface OrderItemGroup {
  name: string;
  phone: string;
  address: string;
  products: string[];
}

export interface OrderDetail {
  placedDate: string;
  placedBy: string;
  currencyCode: string;
  subtotal: number;
  shippingPrice: number;
  ccProcessingFee: number;
  tax: number;
  estimatedTax: number;
  total: number;
  payment: PaymentMethod;
  itemGroups: OrderItemGroup[];
}
