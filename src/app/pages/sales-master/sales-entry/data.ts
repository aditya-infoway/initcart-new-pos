// ── Sales Entry — types & helpers ────────────────────────────────────────────

export interface SaleRecord {
  id: number;
  date: string;
  terms: string;
  party: string;
  billNo: string;
  dueDate: string;
  narration: string;
  totalBasic: number;
  totalTax: number;
  for_: number; // freight+other+round
  grandTotal: number;
}

export interface SaleItem {
  id: number;
  itemName: string;
  hsn: string;
  barcode: string;
  size: string;
  color: string;
  salesPrice: number;
  stock: number;
  unit: string;
  taxPercent: number;
  variantId?: number;
}

export interface CartLine {
  saleItemId: number;
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
  variantId?: number;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  address: string;
}

export interface PaymentTerm {
  id: string;
  label: string;
}

export function mapApiSaleRecord(raw: any): SaleRecord {
  return {
    id: Number(raw.id ?? 0),
    date: String(raw.date ?? raw.bill_date ?? ""),
    terms: String(raw.terms ?? raw.payment_terms ?? ""),
    party: String(raw.party ?? raw.customer_name ?? ""),
    billNo: String(raw.bill_no ?? raw.voucher_no ?? ""),
    dueDate: String(raw.due_date ?? ""),
    narration: String(raw.narration ?? ""),
    totalBasic: Number(raw.total_basic ?? raw.basic_amount ?? 0),
    totalTax: Number(raw.total_tax ?? raw.tax_amount ?? 0),
    for_: Number(raw.for ?? raw.freight ?? 0),
    grandTotal: Number(raw.grand_total ?? raw.net_amount ?? 0),
  };
}

export function mapApiSaleItem(raw: any): SaleItem {
  return {
    id: Number(raw.id ?? 0),
    itemName: String(raw.item_name ?? raw.name ?? ""),
    hsn: String(raw.hsn ?? raw.hsn_code ?? ""),
    barcode: String(raw.barcode ?? ""),
    size: raw.size ? String(raw.size) : "—",
    color: raw.color ? String(raw.color) : "—",
    salesPrice: Number(raw.sales_price ?? raw.price ?? 0),
    stock: Number(raw.stock ?? 0),
    unit: String(raw.unit ?? raw.unit_name ?? "pc"),
    taxPercent: Number(String(raw.tax_percent ?? raw.gst ?? "0").replace("%", "")),
    variantId: raw.variant_id ? Number(raw.variant_id) : undefined,
  };
}

export function mapApiCustomer(raw: any): Customer {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? raw.account_name ?? raw.customer_name ?? ""),
    mobile: String(raw.mobile ?? raw.phone ?? ""),
    email: String(raw.email ?? ""),
    address: String(raw.address ?? ""),
  };
}

export function calcCartLine(
  item: SaleItem,
  qty: number,
  price: number,
  discPercent: number,
): CartLine {
  const basic = price * qty;
  const discAmt = (basic * discPercent) / 100;
  const taxable = basic - discAmt;
  const taxAmt = (taxable * item.taxPercent) / 100;
  const net = taxable + taxAmt;
  return {
    saleItemId: item.id,
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
    basic,
    discAmt,
    taxAmt,
    net,
    variantId: item.variantId,
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
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const grandTotal = totalBasic - totalDiscount + totalTax + freight + otherExpense + roundAmt;
  return { totalBasic, totalDiscount, totalTax, cgst, sgst, freight, otherExpense, roundAmt, grandTotal };
}
