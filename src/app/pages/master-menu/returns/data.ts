// src/app/pages/branch/returns/data.ts
export interface ReturnItem {
  id: number;
  return_id: string;
  order_number: string;
  product_name: string;
  sku: string;
  customer_name: string;
  item_total: number;
  reason: string;
  description: string;
  images: string[];
  quantity: number;
  status: string;
  vendor_remarks: string | null;
  requested_at: string;
  payment_method: "cod" | "razorpay";
  refund_status: "pending" | "processed" | "failed" | null;
}

export interface ReturnPagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ReturnStats {
  total: number;
  requested: number;
  vendor_approved: number;
  vendor_rejected: number;
  re_requested: number;
  admin_approved: number;
  admin_rejected: number;
}

export const EMPTY_STATS: ReturnStats = {
  total: 0, requested: 0, vendor_approved: 0, vendor_rejected: 0,
  re_requested: 0, admin_approved: 0, admin_rejected: 0,
};

export const PAGE_SIZES = [10, 15, 25, 50];

export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://api.initcart.com";

export const getFullImageUrl = (url: string) =>
  url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

export function formatReturnDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatReturnCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2,
  }).format(amount || 0);
}

export const RETURN_STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  requested:        { label: "Requested",       bg: "bg-amber-50 dark:bg-amber-500/10",     color: "text-amber-700 dark:text-amber-300" },
  vendor_approved:  { label: "Vendor Approved", bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-700 dark:text-emerald-300" },
  vendor_rejected:  { label: "Vendor Rejected", bg: "bg-orange-50 dark:bg-orange-500/10",   color: "text-orange-700 dark:text-orange-300" },
  re_requested:     { label: "Re-Requested",    bg: "bg-blue-50 dark:bg-blue-500/10",       color: "text-blue-700 dark:text-blue-300" },
  admin_approved:   { label: "Admin Approved",  bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-700 dark:text-emerald-300" },
  admin_rejected:   { label: "Admin Rejected",  bg: "bg-red-50 dark:bg-red-500/10",         color: "text-red-700 dark:text-red-300" },
};

export function getReturnStatusBadge(status: string) {
  return RETURN_STATUS_BADGE[status] ?? {
    label: status.replace(/_/g, " "),
    bg: "bg-gray-100 dark:bg-dark-600",
    color: "text-gray-700 dark:text-dark-200",
  };
}

export const RETURN_STAT_CARDS: {
  key: keyof ReturnStats | "all";
  label: string;
  cardBg: string;
  iconBg: string;
}[] = [
  { key: "total",           label: "Total",        cardBg: "bg-gradient-to-br from-primary-500 to-primary-700", iconBg: "bg-white/20" },
  { key: "requested",       label: "Requested",    cardBg: "bg-gradient-to-br from-amber-400 to-amber-600",     iconBg: "bg-white/20" },
  { key: "vendor_approved", label: "Approved",     cardBg: "bg-gradient-to-br from-emerald-500 to-emerald-700", iconBg: "bg-white/20" },
  { key: "vendor_rejected", label: "Rejected",     cardBg: "bg-gradient-to-br from-orange-500 to-orange-600",   iconBg: "bg-white/20" },
  { key: "re_requested",    label: "Re-Requested", cardBg: "bg-gradient-to-br from-blue-500 to-blue-700",       iconBg: "bg-white/20" },
];

export function getRefundBadge(s: ReturnItem["refund_status"]) {
  if (!s) return { label: "-", bg: "", color: "text-gray-400" };
  const map = {
    pending:   { label: "Refund pending", bg: "bg-amber-50 dark:bg-amber-500/10",   color: "text-amber-700 dark:text-amber-300" },
    processed: { label: "Refunded",       bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-700 dark:text-emerald-300" },
    failed:    { label: "Refund failed",  bg: "bg-red-50 dark:bg-red-500/10",       color: "text-red-700 dark:text-red-300" },
  } as const;
  return map[s];
}