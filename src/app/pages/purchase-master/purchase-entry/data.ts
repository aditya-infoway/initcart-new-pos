// src/app/pages/purchase-master/data.ts

export interface PurchaseItemLine {
  itemName: string;
  hsnCode: string;
  qty: string;
  altQty: string;
  price: string;
  unit: string;
  discountPercent: string;
  taxPercent: string;
  basicAmount: string;
  discountAmount: string;
  taxAmount: string;
  netAmount: string;
  barcode: string;
}

export interface PurchaseRecord {
  id: number;
  billNo: string;
  purchaseBillNo: string;
  date: string;
  partyName: string;
  paymentTerms: string;
  narration: string;
  totalBasic: number;
  totalTax: number;
  grandTotal: number;
  dueDate: string | null;
  for_: number;
  items: PurchaseItemLine[];
  createdByName?: string;
}

export const round2 = (val: any): number => {
  const n = Number(val);
  if (isNaN(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

export function mapRow(raw: any): PurchaseRecord {
  const fright = round2(raw.frightcharge ?? raw.fright_charge ?? 0);
  const other  = round2(raw.otherexpnse  ?? raw.other_expense  ?? 0);
  const round  = round2(raw.roundamount  ?? raw.round_amount   ?? 0);
  return {
    id:             Number(raw.id ?? 0),
    billNo:         String(raw.billNo ?? raw.bill_no ?? ""),
    purchaseBillNo: String(raw.purchasebill_no ?? raw.purchase_bill_no ?? raw.pur_bill_no ?? ""),
    date:           String(raw.date ?? ""),
    partyName:      String(raw.party_name_name ?? raw.party_name ?? raw.vendor_name ?? ""),
    paymentTerms:   String(raw.terms ?? raw.payment_terms ?? ""),
    narration:      String(raw.narration ?? ""),
    createdByName:  String(raw.created_by_name ?? ""),
    totalBasic:     round2(raw.total_basic ?? 0),
    totalTax:       round2(raw.total_tax ?? 0),
    grandTotal:     round2(raw.grand_total ?? 0),
    dueDate:        raw.dueDate ?? raw.due_date ?? null,
    for_:           round2(fright + other + round),
    items: Array.isArray(raw.items)
      ? raw.items.map((i: any) => ({
          itemName:        String(i.itemName_name ?? i.itemName ?? i.item_name ?? ""),
          hsnCode:         String(i.hsnCode ?? i.hsn_code ?? ""),
          qty:             String(i.quantity ?? i.qty ?? "0"),
          altQty:          String(i.altQuantity ?? i.alt_qty ?? "0"),
          price:           String(i.price ?? "0"),
          unit:            String(i.per ?? i.unit ?? "pc"),
          discountPercent: String(i.discountPercent ?? i.discount_percent ?? "0"),
          taxPercent:      String(i.taxAmount !== undefined ? "" : (i.tax_percent ?? "0")),
          basicAmount:     String(i.basicAmount ?? i.basic_amount ?? "0"),
          discountAmount:  String(i.discountAmount ?? i.discount_amount ?? "0"),
          taxAmount:       String(i.taxAmount ?? i.tax_amount ?? "0"),
          netAmount:       String(i.netValue ?? i.net_amount ?? "0"),
          barcode:         String(i.barcode ?? ""),
        }))
      : [],
  };
}