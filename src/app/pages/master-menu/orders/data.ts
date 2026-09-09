export type OrderStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "packaging"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"
  | "failed";

export interface Order {
  id: number;
  orderId: string;
  orderDate: string;
  customer: string;
  totalAmount: string;
  status: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  packaging: number;
  out_for_delivery: number;
  delivered: number;
  cancelled: number;
  returned: number;
  failed: number;
}

export interface OrderPagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export function mapApiOrder(raw: Record<string, any>): Order {
  return {
    id: Number(raw.id ?? 0),
    orderId: String(raw.order_id ?? raw.orderId ?? `#${raw.id}`),
    orderDate: String(raw.order_date ?? raw.created_at ?? ""),
    customer: String(raw.customer_name ?? raw.customer ?? "—"),
    totalAmount: String(raw.total_amount ?? raw.total ?? "0.00"),
    status: String(raw.status ?? "pending"),
  };
}

export interface OrderItemDetail {
  id: number;
  product_name: string;
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  tax_percentage: number;
  discount_amount: number;
  total_price: number;
  item_status: string;
  product_details: {
    main_image: string | null;
    thumbnail: string | null;
    variant_image?: string | null;
  };
}

export interface OrderSummary {
  vendor_subtotal: number;
  vendor_discount: number;
  vendor_tax: number;
  vendor_total: number;
  total_items: number;
  total_quantity: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  shipping_address: ShippingAddress;
}

export interface DeliveryInfo {
  delivery_service: string;
  delivery_man_name: string | null;
  delivery_man_phone: string | null;
  delivery_incentive: number | null;
  expected_delivery_date: string | null;
  tracking_id: string | null;
  courier_name: string | null;
  courier_website: string | null;
  delivery_status: string;
}

export interface OrderDetail {
  id: number;
  order_number: string;
  created_at: string;
  updated_at: string;
  customer_details: CustomerDetails;
  payment_method: string;
  payment_status: string;
  order_status: string;
  items: OrderItemDetail[];
  tax_percentage: number;
  order_summary: OrderSummary;
  delivery_info: DeliveryInfo | null;
  notes: string | null;
}

export const ORDER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Packaging" },
  { value: "shipped", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Returned" },
];

export function formatINR(amount: number | null | undefined): string {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export const STATUS_TABS: { key: OrderStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packaging", label: "Packaging" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "returned", label: "Returned" },
  { key: "failed", label: "Failed" },
];

export const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  delivered:        { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  pending:          { color: "text-amber-700 dark:text-amber-300",     bg: "bg-amber-50 dark:bg-amber-500/10" },
  confirmed:        { color: "text-blue-700 dark:text-blue-300",       bg: "bg-blue-50 dark:bg-blue-500/10" },
  packaging:        { color: "text-purple-700 dark:text-purple-300",   bg: "bg-purple-50 dark:bg-purple-500/10" },
  out_for_delivery: { color: "text-indigo-700 dark:text-indigo-300",   bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  cancelled:        { color: "text-red-700 dark:text-red-300",         bg: "bg-red-50 dark:bg-red-500/10" },
  returned:         { color: "text-orange-700 dark:text-orange-300",   bg: "bg-orange-50 dark:bg-orange-500/10" },
  failed:           { color: "text-rose-700 dark:text-rose-300",       bg: "bg-rose-50 dark:bg-rose-500/10" },
};

export function getStatusBadge(status: string) {
  const key = status?.toLowerCase().replace(/\s+/g, "_");
  return STATUS_BADGE[key] ?? { color: "text-gray-700 dark:text-dark-200", bg: "bg-gray-100 dark:bg-dark-600" };
}

export const STATS_CONFIG: {
  key: keyof OrderStats;
  label: string;
  cardBg: string;
  iconBg: string;
}[] = [
  { key: "total",            label: "Total",            cardBg: "bg-gradient-to-br from-primary-500 to-primary-700",         iconBg: "bg-white/20" },
  { key: "pending",          label: "Pending",          cardBg: "bg-gradient-to-br from-amber-400 to-amber-600",             iconBg: "bg-white/20" },
  { key: "confirmed",        label: "Confirmed",        cardBg: "bg-gradient-to-br from-blue-500 to-blue-700",               iconBg: "bg-white/20" },
  { key: "packaging",        label: "Packaging",        cardBg: "bg-gradient-to-br from-purple-500 to-purple-700",           iconBg: "bg-white/20" },
  { key: "out_for_delivery", label: "Out for Delivery", cardBg: "bg-gradient-to-br from-indigo-500 to-indigo-700",           iconBg: "bg-white/20" },
  { key: "delivered",        label: "Delivered",        cardBg: "bg-gradient-to-br from-emerald-500 to-emerald-700",         iconBg: "bg-white/20" },
  { key: "cancelled",        label: "Cancelled",        cardBg: "bg-gradient-to-br from-red-500 to-red-700",                 iconBg: "bg-white/20" },
  { key: "returned",         label: "Returned",         cardBg: "bg-gradient-to-br from-orange-500 to-orange-600",           iconBg: "bg-white/20" },
  { key: "failed",           label: "Failed",           cardBg: "bg-gradient-to-br from-rose-500 to-rose-700",               iconBg: "bg-white/20" },
];
