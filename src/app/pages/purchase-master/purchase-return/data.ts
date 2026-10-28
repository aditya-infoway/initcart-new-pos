// src/app/pages/purchase-master/purchase-return/data.ts

export interface PurchaseReturnRecord {
  id: number;
  returnNo: string;
  date: string;
  partyName: string;
  reason: string;
  returnType: string;
  approvedBy: string;
  grandTotal: number;
  items: any[];
  createdByName?: string;
}

export interface ReturnItem {
  id: number;
  purchase_item_id: number;
  item_id: number;
  variant_id: number | null;
  item_name: string;
  hsn_code: string;
  return_quantity: number;
  max_quantity: number;
  original_quantity: number;
  already_returned: number;
  price: number;
  tax_percent: number;
  basic_amount: number;
  tax_amount: number;
  net_amount: number;
  unit: string;
}

export interface CreditSummary {
  grand_total: number;
  total_paid: number;
  total_returned: number;
  pending_amount: number;
  payment_history: {
    entry_type: string; type: string; voucher_no: string;
    date: string; amount: number; mode: string; narration: string;
  }[];
}

export function mapApiPurchaseReturn(raw: any): PurchaseReturnRecord {
  return {
    id: Number(raw.id ?? 0),
    returnNo: String(raw.return_no ?? ""),
    date: String(raw.date ?? ""),
    partyName: String(raw.party_name ?? ""),
    reason: String(raw.reason_for_return ?? ""),
    returnType: String(raw.return_type ?? ""),
    approvedBy: String(raw.approved_by ?? ""),
    grandTotal: Number(raw.grand_total ?? 0),
    items: Array.isArray(raw.items) ? raw.items : [],
    createdByName: String(raw.created_by_name ?? ""),
  };
}