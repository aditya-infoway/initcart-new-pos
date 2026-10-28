// src/app/pages/sales-master/sales-entry/data.ts

// ── Shared types & helpers for all sales-entry pages ──────────────────────

export interface SaleItem {
  id: number;         // variant id
  itemId: number;     // pos_items id
  itemName: string;
  hsn: string;
  barcode: string;
  size: string;
  color: string;
  salesPrice: number;
  perUnitPrice: number;
  stock: number;
  unit: string;
  unitSupportsFractional: boolean;
  taxPercent: number;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  address: string;
  state?: string;
}

export interface PaymentTerm {
  id: string;
  label: string;
}

export interface CartLine {
  id: number;
  itemId: number;
  variantId: number;
  itemName: string;
  hsn: string;
  barcode: string;
  size: string;
  color: string;
  qty: number;
  price: number;
  unit: string;
  taxPercent: number;
  discPercent: number;
  basic: number;
  discAmt: number;
  taxAmt: number;
  net: number;
  cgst: number;
  sgst: number;
  igst: number;
}

// Used by grid POS UX (sales-entry-form2.tsx) — uses strings for display
export interface GridCartItem {
  id: number;
  itemId: number;
  variantId: number | null;
  itemName: string;
  hsnCode: string;
  quantity: number;
  price: number;
  per: string;
  taxSlab: string;
  discountPercent: number;
  basicAmount: string;
  discountAmount: string;
  taxAmount: string;
  netValue: string;
  cgst: string;
  sgst: string;
  igst: string;
}

export interface ReferralLookupResult {
  found: boolean;
  agent_id?: number;
  full_name?: string;
  contact_number?: string;
  agent_type?: string;
  referral_code?: string;
  message?: string;
}

export interface SaleItemTaxResult {
  basic: number;
  discAmt: number;
  taxAmt: number;
  net: number;
  cgst: number;
  sgst: number;
  igst: number;
}

// ── Constants ─────────────────────────────────────────────────────────────
export const VARIANT_BY_BRANCH: Record<string, string[]> = {
  fashion: ["size", "color"],
  electronics: ["size", "color", "srno", "warrantydate"],
  mart: ["size"],
};

export const GRID_PAGE_SIZE = 24;
export const LIST_PAGE_SIZE = 15;
export const MODAL_PAGE_SIZE = 50;
export const SEARCH_DEBOUNCE_MS = 150;
export const CACHE_TTL_MS = 30000;

// ── Mappers ────────────────────────────────────────────────────────────────
export function mapApiSaleItem(raw: any): SaleItem {
  const variantId = Number(raw.id ?? 0);
  const itemId = Number(raw.itemId ?? raw.item_id ?? 0);
  const salesPrice = Number(raw.salesPrice ?? raw.sales_price ?? raw.price ?? 0);
  const perUnitPrice = Number(raw.per_unit_price ?? salesPrice);
  const unitSupportsFractional = Boolean(raw.unit_supports_fractional);
  const effectivePrice =
    unitSupportsFractional && perUnitPrice > 0 ? perUnitPrice : salesPrice;

  return {
    id: variantId,
    itemId,
    itemName: String(raw.itemName ?? raw.item_name ?? raw.name ?? ""),
    hsn: String(raw.hsnCode ?? raw.hsn_code ?? raw.hsn ?? ""),
    barcode: String(raw.barcode ?? ""),
    size: raw.size ? String(raw.size) : "—",
    color: raw.color ? String(raw.color) : "—",
    salesPrice: effectivePrice,
    perUnitPrice,
    stock: Number(raw.current_stock ?? raw.stock ?? 0),
    unit: String(raw.unit ?? raw.unit_name ?? "pc"),
    unitSupportsFractional,
    taxPercent: Number(
      String(raw.taxSlab ?? raw.tax_percent ?? raw.gst ?? "0").replace("%", ""),
    ),
  };
}

export function mapApiCustomer(raw: any): Customer {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? raw.account_name ?? raw.customer_name ?? ""),
    mobile: String(raw.mobile ?? raw.phone ?? ""),
    email: String(raw.email ?? ""),
    address: String(raw.address ?? ""),
    state: raw.state ? String(raw.state) : undefined,
  };
}

export function mapTaxResponse(d: any): SaleItemTaxResult {
  return {
    basic: Number(d.basic_amount ?? 0),
    discAmt: Number(d.discount_amount ?? 0),
    taxAmt: Number(d.total_tax ?? 0),
    net: Number(d.net_amount ?? 0),
    cgst: Number(d.cgst ?? 0),
    sgst: Number(d.sgst ?? 0),
    igst: Number(d.igst ?? 0),
  };
}

// Grid POS mapper (raw rows from sale-search-item → SaleItem shape)
export function mapGridRow(item: any): SaleItem {
  return {
    id: item.id,
    itemId: item.itemId,
    itemName: item.itemName,
    hsn: item.hsnCode || "",
    barcode: item.barcode || "",
    size: item.size || "—",
    color: item.color || "—",
    salesPrice: item.salesPrice || 0,
    perUnitPrice: item.per_unit_price || item.salesPrice || 0,
    stock: item.current_stock || 0,
    unit: item.unit || "",
    unitSupportsFractional: item.unit_supports_fractional || false,
    taxPercent: Number(String(item.taxSlab ?? "0").replace("%", "")),
  };
}

// ── Builders / calculators ────────────────────────────────────────────────
export function buildCartLine(
  id: number,
  item: SaleItem,
  qty: number,
  price: number,
  discPercent: number,
  tax: SaleItemTaxResult,
): CartLine {
  return {
    id,
    itemId: item.itemId,
    variantId: item.id,
    itemName: item.itemName,
    hsn: item.hsn,
    barcode: item.barcode,
    size: item.size,
    color: item.color,
    qty,
    price,
    unit: item.unit,
    taxPercent: item.taxPercent,
    discPercent,
    basic: tax.basic,
    discAmt: tax.discAmt,
    taxAmt: tax.taxAmt,
    net: tax.net,
    cgst: tax.cgst,
    sgst: tax.sgst,
    igst: tax.igst,
  };
}

export function calcSummary(
  cart: CartLine[],
  freight: number,
  otherExpense: number,
  roundAmt: number,
) {
  const totalBasic = cart.reduce((s, l) => s + l.basic, 0);
  const totalDiscount = cart.reduce((s, l) => s + l.discAmt, 0);
  const totalTax = cart.reduce((s, l) => s + l.taxAmt, 0);
  const cgst = cart.reduce((s, l) => s + l.cgst, 0);
  const sgst = cart.reduce((s, l) => s + l.sgst, 0);
  const igst = cart.reduce((s, l) => s + l.igst, 0);
  const itemsNet = cart.reduce((s, l) => s + l.net, 0);
  const grandTotal = itemsNet + freight + otherExpense + roundAmt;
  return {
    totalBasic,
    totalDiscount,
    totalTax,
    cgst,
    sgst,
    igst,
    freight,
    otherExpense,
    roundAmt,
    grandTotal,
  };
}

// Grid POS: totals from GridCartItem list
export function calcGridTotals(items: GridCartItem[]) {
  return {
    totalBasic: items.reduce((s, i) => s + Number(i.basicAmount || 0), 0),
    totalDiscount: items.reduce((s, i) => s + Number(i.discountAmount || 0), 0),
    totalTax: items.reduce((s, i) => s + Number(i.taxAmount || 0), 0),
    totalNet: items.reduce((s, i) => s + Number(i.netValue || 0), 0),
    totalCgst: items.reduce((s, i) => s + Number(i.cgst || 0), 0),
    totalSgst: items.reduce((s, i) => s + Number(i.sgst || 0), 0),
    totalIgst: items.reduce((s, i) => s + Number(i.igst || 0), 0),
  };
}