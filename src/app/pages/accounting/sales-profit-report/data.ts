// src/app/pages/reports/sales-profit-report/data.ts
export interface SalesBillLineItem {
  id: number;
  itemName: string;
  hsn: string;
  qty: number;
  salePrice: number;
  per: string;
  discPercent: number;
  taxPercent: number;
  netAmount: number;
  salesNet: number;
  purchasePrice: number;
  purchaseCost: number;
  lineProfit: number;
}

export interface SalesBill {
  id: number;
  billNo: string;
  billDate: string;
  customerName: string;
  terms: string;
  /** "Exclusive" | "Inclusive" | "Unknown" — matches old page */
  gstType: string;
  items: number;
  billAmount: number;
  salesNet: number;
  purchaseCost: number;
  profit: number;
  profitPercent: number;
  lineItems: SalesBillLineItem[];
}

export interface Branch {
  id: number;
  branch_name: string;
}

export interface ProfitSummary {
  billAmount: number;
  salesNet: number;
  purchaseCost: number;
  profit: number;
}

export interface FilterOptions {
  dateFrom: string;
  dateTo: string;
}

export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

/** Same mapping rules as the old non-theme page. */
export function mapApiBill(raw: any): SalesBill {
  const gst = raw.gst_toggle_status;
  return {
    id: Number(raw.id ?? 0),
    billNo: String(raw.bill_no ?? ""),
    billDate: String(raw.bill_date ?? ""),
    customerName: String(raw.customer_name ?? ""),
    terms: String(raw.payment_terms ?? raw.terms ?? ""),
    gstType:
      gst === null || gst === undefined
        ? "Unknown"
        : gst
          ? "Exclusive"
          : "Inclusive",
    items: Number(raw.number_of_items ?? raw.item_count ?? 0),
    billAmount: Number(raw.bill_amount ?? 0),
    salesNet: Number(raw.sales_net ?? 0),
    purchaseCost: Number(raw.purchase_cost ?? 0),
    profit: Number(raw.profit_amount ?? raw.profit ?? 0),
    profitPercent: Number(raw.profit_percent ?? 0),
    lineItems: Array.isArray(raw.line_items)
      ? raw.line_items.map(mapApiLineItem)
      : [],
  };
}

export function mapApiLineItem(raw: any): SalesBillLineItem {
  return {
    id: Number(raw.id ?? 0),
    itemName: String(raw.item_name ?? ""),
    hsn: String(raw.hsn_code ?? raw.hsn ?? ""),
    qty: Number(raw.qty ?? 0),
    salePrice: Number(raw.price ?? raw.sale_price ?? 0),
    per: String(raw.unit ?? raw.per ?? "pc"),
    discPercent: Number(raw.discount_percent ?? raw.disc_percent ?? 0),
    taxPercent: Number(raw.tax_percent ?? 0),
    netAmount: Number(raw.net_amount ?? 0),
    salesNet: Number(raw.sales_net ?? 0),
    purchasePrice: Number(raw.purchase_price ?? 0),
    purchaseCost: Number(raw.purchase_cost ?? 0),
    lineProfit: Number(raw.line_profit ?? 0),
  };
}

/** Terms badge colour — same as old page. */
export function termsColor(t: string) {
  switch (t?.toLowerCase()) {
    case "credit":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
    case "cash":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
    case "bank":
      return "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-dark-600 dark:text-dark-200";
  }
}

/** GST badge colour — same as old page. */
export function gstColor(g: string) {
  if (g === "Exclusive")
    return "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-700/40";
  if (g === "Inclusive")
    return "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-700/40";
  return "bg-gray-100 text-gray-600 dark:bg-dark-600 dark:text-dark-200";
}

/** Profit % chip colour — same as old page. */
export function profitBg(p: number) {
  return p >= 0
    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
}

export function profitColor(p: number) {
  return p >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
}