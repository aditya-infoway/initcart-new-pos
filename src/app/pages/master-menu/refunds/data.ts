// src/app/pages/branch/refunds/data.ts
export interface RefundItem {
  id: number;
  refund_id: string;
  refund_type: "online" | "cod";
  return_id: string;
  order_number: string;
  product_name: string;
  customer_name: string;
  refund_amount: number;
  paid_amount: number | null;
  status: "pending" | "processed" | "failed";
  processed_at: string | null;
  created_at: string;
}

export interface RefundPagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface RefundStats {
  total: number;
  pending: number;
  processed: number;
  failed: number;
  total_amount: number;
  pending_amount: number;
  processed_amount: number;
  failed_amount: number;
}

export const EMPTY_REFUND_STATS: RefundStats = {
  total: 0, pending: 0, processed: 0, failed: 0,
  total_amount: 0, pending_amount: 0, processed_amount: 0, failed_amount: 0,
};

export const REFUND_PAGE_SIZES = [10, 15, 25, 50];

export function formatRefundCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatRefundDate(d: string | null) {
  return d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "-";
}

export const REFUND_STATUS_BADGE: Record<
  RefundItem["status"],
  { label: string; bg: string; color: string }
> = {
  pending:   { label: "Pending",   bg: "bg-amber-50 dark:bg-amber-500/10",   color: "text-amber-700 dark:text-amber-300" },
  processed: { label: "Processed", bg: "bg-emerald-50 dark:bg-emerald-500/10", color: "text-emerald-700 dark:text-emerald-300" },
  failed:    { label: "Failed",    bg: "bg-red-50 dark:bg-red-500/10",       color: "text-red-700 dark:text-red-300" },
};

export function getRefundStatusBadge(status: string) {
  return REFUND_STATUS_BADGE[status as RefundItem["status"]] ?? {
    label: status,
    bg: "bg-gray-100 dark:bg-dark-600",
    color: "text-gray-700 dark:text-dark-200",
  };
}

export const REFUND_STAT_CARDS: {
  key: keyof RefundStats | "all";
  label: string;
  amountKey: keyof RefundStats;
  cardBg: string;
  iconBg: string;
}[] = [
  { key: "total",     label: "Total Refunds", amountKey: "total_amount",     cardBg: "bg-gradient-to-br from-primary-500 to-primary-700", iconBg: "bg-white/20" },
  { key: "pending",   label: "Pending",       amountKey: "pending_amount",   cardBg: "bg-gradient-to-br from-amber-400 to-amber-600",     iconBg: "bg-white/20" },
  { key: "processed", label: "Processed",     amountKey: "processed_amount", cardBg: "bg-gradient-to-br from-emerald-500 to-emerald-700", iconBg: "bg-white/20" },
  { key: "failed",    label: "Failed",        amountKey: "failed_amount",    cardBg: "bg-gradient-to-br from-red-500 to-red-700",         iconBg: "bg-white/20" },
];