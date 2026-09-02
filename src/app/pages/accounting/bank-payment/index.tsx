import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowDownTrayIcon, ArrowPathIcon, BanknotesIcon,
  BuildingLibraryIcon, CurrencyRupeeIcon,
  DocumentTextIcon, MagnifyingGlassIcon,
  PlusIcon, PrinterIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Controller, useForm } from "react-hook-form";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Input, Radio } from "@/components/ui";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { Combobox } from "@/components/shared/form/StyledCombobox";
import { DatePicker } from "@/components/shared/form/DatePicker";
import { Get, Post, toasterrormsg, toastsuccessmsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import { usePermission } from "@/hooks/usePermissions";

// ── Types ──────────────────────────────────────────────────────────────────
interface BankPaymentRow {
  id: number;
  date: string;
  type: string;
  voucherNo: string;
  bankAccountName: string;
  partyName: string;
  amount: number;
  mode: string;
  chequeNo: string | null;
  chequeDate: string | null;
  chequeClearDate: string | null;
  narration: string;
  createdByName?: string;
}

function mapRow(raw: any): BankPaymentRow {
  return {
    id:               Number(raw.id ?? 0),
    date:             String(raw.date ?? ""),
    type:             String(raw.type ?? "BP"),
    voucherNo:        String(raw.voucher_no ?? ""),
    bankAccountName:  String(raw.bank_account_name ?? ""),
    partyName:        String(raw.party_name ?? ""),
    amount:           Number(raw.amount ?? 0),
    mode:             String(raw.mode ?? ""),
    chequeNo:         raw.cheque_no ?? null,
    chequeDate:       raw.cheque_date ?? null,
    chequeClearDate:  raw.cheque_clear_date ?? null,
    narration:        String(raw.narration ?? ""),
    createdByName:    String(raw.created_by_name ?? ""),
  };
}

interface AccountOption { id: number; label: string; }
interface BillResult {
  id: number;
  billNo: string;
  partyName: string;
  originalBillNo: string | null;
  date: string;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  partyId?: number;
}

function mapBill(raw: any): BillResult {
  return {
    id:             Number(raw.id ?? 0),
    billNo:         String(raw.billNo ?? raw.bill_no ?? ""),
    partyName:      String(raw.partyName__account_name ?? raw.party_name ?? ""),
    originalBillNo: raw.originalBillNo ?? raw.original_bill_no ?? null,
    date:           String(raw.date ?? ""),
    grandTotal:     Number(raw.grand_total ?? 0),
    paidAmount:     Number(raw.paid_amount ?? 0),
    pendingAmount:  Number(raw.pending_amount ?? 0),
    partyId:        raw.party_id ? Number(raw.party_id) : undefined,
  };
}

interface StockReceivedBill {
  id: number;
  transfer_no: string;
  from_branch_name: string;
  pending_amount: number;
  main_account_name: string | null;
}

interface StockReturnRefundBill {
  id: number;
  return_no: string;
  from_branch_name: string;
  pending_amount: number;
  linked_account_id: number | null;
  linked_account_name: string | null;
  linked_account_type: string | null;
}

const today = new Date().toISOString().split("T")[0];

interface FormValues {
  paymentType: "manual" | "salesReturn" | "purchaseEntry" | "stockReceived" | "stockReturn";
  bankAccount: number | null;
  voucherNo: string;
  date: string;
  opAccount: number | null;
  amount: string;
  mode: "NEFT" | "RTGS" | "IMPS" | "UPI" | "CHEQUE";
  chequeNo: string;
  chequeDate: string;
  chequeClearDate: string;
  narration: string;
  billNo: string;
  selectedBill: BillResult | StockReceivedBill | StockReturnRefundBill | null;
}

const DEFAULT_VALUES: FormValues = {
  paymentType:    "manual",
  bankAccount:    null,
  voucherNo:      "",
  date:           today,
  opAccount:      null,
  amount:         "",
  mode:           "NEFT",
  chequeNo:       "",
  chequeDate:     "",
  chequeClearDate:"",
  narration:      "",
  billNo:         "",
  selectedBill:   null,
};

// ── Type badge ─────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, "success" | "info" | "warning" | "primary" | "secondary"> = {
  BP: "success",
  PBP: "info",
  SRBP: "warning",
  STBP: "primary",
  STRBP: "secondary",
};

function TypeBadge({ type }: { type: string }) {
  return (
    <Badge color={TYPE_COLOR[type] ?? "primary"} variant="soft">
      {type || "BP"}
    </Badge>
  );
}

// ── Mode badge ─────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: string }) {
  const color = mode === "CHEQUE" ? "warning" : mode === "UPI" ? "info" : "primary";
  return <Badge color={color} variant="soft">{mode || "—"}</Badge>;
}

// ── Stock Received Dropdown ──────────────────────────────────────────────
function StockReceivedDropdown({
  onSelectBill,
  refreshKey,
  disabled = false,
}: {
  onSelectBill: (bill: StockReceivedBill) => void;
  refreshKey: number;
  disabled?: boolean;
}) {
  const [bills, setBills] = useState<StockReceivedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const loadBills = async () => {
      setLoading(true);
      try {
        const res = await Get("pos/stock-received-bills/") as any;
        const body = res?.data ?? res;
        const data = Array.isArray(body?.bills) ? body.bills : Array.isArray(body) ? body : [];
        setBills(data.map((b: any) => ({
          id: Number(b.id),
          transfer_no: String(b.transfer_no ?? ""),
          from_branch_name: String(b.from_branch_name ?? ""),
          pending_amount: Number(b.pending_amount ?? 0),
          main_account_name: b.main_account_name ?? null,
        })));
      } catch {
        toasterrormsg("Failed to load stock received bills");
        setBills([]);
      } finally {
        setLoading(false);
      }
    };
    loadBills();
  }, [refreshKey]);

  const selectedBill = bills.find((b) => String(b.id) === selectedId);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">Select Stock Received Bill</label>
      <div
        className={clsx(
          "w-full p-2 border rounded bg-white cursor-pointer flex justify-between items-center",
          disabled ? "opacity-60 cursor-not-allowed" : "",
          "border-gray-300 dark:border-dark-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedBill ? "text-gray-900 dark:text-dark-100" : "text-gray-500 dark:text-dark-400"}>
          {selectedBill
            ? `${selectedBill.transfer_no} — from ${selectedBill.from_branch_name} — ₹${selectedBill.pending_amount.toFixed(2)}`
            : loading ? "Loading..." : bills.length === 0 ? "No pending bills" : "-- Select Transfer --"}
        </span>
        <span className="text-gray-400">▼</span>
      </div>

      {isOpen && !disabled && !loading && bills.length > 0 && (
        <div className="absolute right-0 mt-1 w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded shadow-lg z-50 overflow-hidden">
          <div className="overflow-y-auto max-h-[200px]">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-2 border-b last:border-b-0 text-sm hover:bg-primary/10 cursor-pointer dark:border-dark-600"
                onClick={() => {
                  setSelectedId(String(bill.id));
                  onSelectBill(bill);
                  setIsOpen(false);
                }}
              >
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800 dark:text-dark-100">{bill.transfer_no}</span>
                  <span className="text-gray-600 dark:text-dark-300">from {bill.from_branch_name}</span>
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  Pending: ₹{bill.pending_amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && !disabled && !loading && bills.length === 0 && (
        <div className="absolute right-0 mt-1 w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded shadow-lg z-50 p-4 text-center text-gray-500 dark:text-dark-400 text-sm">
          No pending stock received bills
        </div>
      )}
    </div>
  );
}

// ── Stock Return Refund Dropdown ──────────────────────────────────────────
function StockReturnRefundDropdown({
  onSelectBill,
  refreshKey,
  disabled = false,
}: {
  onSelectBill: (bill: StockReturnRefundBill) => void;
  refreshKey: number;
  disabled?: boolean;
}) {
  const [bills, setBills] = useState<StockReturnRefundBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const loadBills = async () => {
      setLoading(true);
      try {
        const res = await Get("pos/stock-return-refund-bills/") as any;
        const body = res?.data ?? res;
        const data = Array.isArray(body?.bills) ? body.bills : Array.isArray(body) ? body : [];
        setBills(data.map((b: any) => ({
          id: Number(b.id),
          return_no: String(b.return_no ?? ""),
          from_branch_name: String(b.from_branch_name ?? ""),
          pending_amount: Number(b.pending_amount ?? 0),
          linked_account_id: b.linked_account_id ? Number(b.linked_account_id) : null,
          linked_account_name: b.linked_account_name ?? null,
          linked_account_type: b.linked_account_type ?? null,
        })));
      } catch {
        toasterrormsg("Failed to load stock return refund bills");
        setBills([]);
      } finally {
        setLoading(false);
      }
    };
    loadBills();
  }, [refreshKey]);

  const selectedBill = bills.find((b) => String(b.id) === selectedId);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">Select Stock Return Bill</label>
      <div
        className={clsx(
          "w-full p-2 border rounded bg-white cursor-pointer flex justify-between items-center",
          disabled ? "opacity-60 cursor-not-allowed" : "",
          "border-gray-300 dark:border-dark-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedBill ? "text-gray-900 dark:text-dark-100" : "text-gray-500 dark:text-dark-400"}>
          {selectedBill
            ? `${selectedBill.return_no} — ${selectedBill.from_branch_name} — ₹${selectedBill.pending_amount.toFixed(2)}`
            : loading ? "Loading..." : bills.length === 0 ? "No pending refunds" : "-- Select Return --"}
        </span>
        <span className="text-gray-400">▼</span>
      </div>

      {isOpen && !disabled && !loading && bills.length > 0 && (
        <div className="absolute right-0 mt-1 w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded shadow-lg z-50 overflow-hidden">
          <div className="overflow-y-auto max-h-[200px]">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={clsx(
                  "p-2 border-b last:border-b-0 text-sm",
                  bill.linked_account_id ? "hover:bg-primary/10 cursor-pointer" : "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-dark-800",
                  "dark:border-dark-600"
                )}
                onClick={() => {
                  if (!bill.linked_account_id) {
                    toasterrormsg(`${bill.from_branch_name} ka Sundry account link nahi hai. Branch Master mein pehle link karo.`);
                    return;
                  }
                  setSelectedId(String(bill.id));
                  onSelectBill(bill);
                  setIsOpen(false);
                }}
              >
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800 dark:text-dark-100">{bill.return_no}</span>
                  <span className={bill.linked_account_id ? "text-gray-600 dark:text-dark-300" : "text-red-500 font-medium"}>
                    {bill.linked_account_name || "No account linked"}
                  </span>
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  Pending: ₹{bill.pending_amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && !disabled && !loading && bills.length === 0 && (
        <div className="absolute right-0 mt-1 w-full bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded shadow-lg z-50 p-4 text-center text-gray-500 dark:text-dark-400 text-sm">
          No pending stock return refunds
        </div>
      )}
    </div>
  );
}

// ── Bill Search Modal ─────────────────────────────────────────────────────
function BillSearchModal({
  isOpen,
  onClose,
  onSelectBill,
  billType,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectBill: (bill: BillResult) => void;
  billType: "salesReturn" | "purchaseEntry";
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [bills, setBills] = useState<BillResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBills("");
    }
  }, [isOpen, billType]);

  const loadBills = async (search: string) => {
    setLoading(true);
    try {
      const url = billType === "salesReturn"
        ? `pos/sales-return-credit-bills/?query=${search}`
        : `pos/purchase-credit-bills/?query=${search}`;
      const res = await Get(url) as any;
      const body = res?.data ?? res;
      const data = Array.isArray(body?.bills) ? body.bills : Array.isArray(body) ? body : [];
      setBills(data.map(mapBill));
    } catch {
      toasterrormsg("Failed to search bills");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    loadBills(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-700 rounded-2xl shadow-lg w-full max-w-4xl max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b bg-primary-600 text-white dark:bg-primary-700">
          <h3 className="text-base font-semibold">
            Search {billType === "salesReturn" ? "Sales Return Credit" : "Purchase Entry Credit"} Bills
          </h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-xl">✕</button>
        </div>
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Bill No or Party Name..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-2 pl-8 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800 dark:border-dark-600 dark:text-dark-100"
            />
            <MagnifyingGlassIcon className="absolute left-2 top-2.5 text-gray-400 size-4" />
          </div>
          <div className="mt-4 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-gray-500 dark:text-dark-400">Loading bills...</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-dark-400">
                <p>No credit bills found</p>
                {searchTerm && <p className="text-xs mt-1">Try a different search term</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-dark-800 sticky top-0">
                    <tr>
                      <th className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-dark-300">Bill No</th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-dark-300">Party</th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-dark-300">Original Bill</th>
                      <th className="p-2 text-left text-xs font-semibold text-gray-600 dark:text-dark-300">Date</th>
                      <th className="p-2 text-right text-xs font-semibold text-gray-600 dark:text-dark-300">Total</th>
                      <th className="p-2 text-right text-xs font-semibold text-gray-600 dark:text-dark-300">Paid</th>
                      <th className="p-2 text-right text-xs font-semibold text-gray-600 dark:text-dark-300">Pending</th>
                      <th className="p-2 text-center text-xs font-semibold text-gray-600 dark:text-dark-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id} className="border-b dark:border-dark-600 hover:bg-primary/5 cursor-pointer">
                        <td className="p-2 font-medium text-primary-600 dark:text-primary-400">{bill.billNo}</td>
                        <td className="p-2 text-gray-700 dark:text-dark-200">{bill.partyName}</td>
                        <td className="p-2 text-xs text-gray-500 dark:text-dark-400">{bill.originalBillNo || "-"}</td>
                        <td className="p-2 text-gray-600 dark:text-dark-300">{bill.date}</td>
                        <td className="p-2 text-right text-gray-700 dark:text-dark-200">₹{bill.grandTotal.toFixed(2)}</td>
                        <td className="p-2 text-right text-emerald-600 dark:text-emerald-400">₹{bill.paidAmount.toFixed(2)}</td>
                        <td className="p-2 text-right text-amber-600 dark:text-amber-400 font-semibold">₹{bill.pendingAmount.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBill(bill);
                            }}
                            className="bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700 transition-colors"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Bank Payment Drawer ────────────────────────────────────────────────
function AddBankPaymentDrawer({
  isOpen,
  close,
  onSaved,
}: {
  isOpen: boolean;
  close: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<AccountOption[]>([]);
  const [allAccounts, setAllAccounts] = useState<AccountOption[]>([]);
  const [salesReturnBills, setSalesReturnBills] = useState<BillResult[]>([]);
  const [purchaseEntryBills, setPurchaseEntryBills] = useState<BillResult[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billModalType, setBillModalType] = useState<"salesReturn" | "purchaseEntry">("salesReturn");

  // ── Role detection ──────────────────────────────────────────────────
  // ✅ isSuperAdmin - localStorage se role check
  const isSuperAdmin = useMemo(() => localStorage.getItem("role") === "superadmin", []);
  const isSuperAdminOrEmployee = useMemo(() => {
    const role = localStorage.getItem("role");
    return role === "superadmin" || role === "employee";
  }, []);

  const {
    control, register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULT_VALUES, mode: "onTouched" });

  const paymentType = watch("paymentType");
  const mode = watch("mode");
  const selectedBill = watch("selectedBill");

  // Fetch bank accounts + all party accounts
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      Get("pos/account-terms-type/", { terms: "bank" }),
      Get("pos/account/"),
    ]).then(([bankRes, allRes]: any[]) => {
      const bBody = bankRes?.data ?? bankRes;
      const bRows: any[] = Array.isArray(bBody) ? bBody
        : Array.isArray(bBody?.results) ? bBody.results : [];
      setBankAccounts(bRows.map((a: any) => ({ id: a.id, label: a.account_name })));

      const aBody = allRes?.data ?? allRes;
      const aRows: any[] = Array.isArray(aBody?.results) ? aBody.results
        : Array.isArray(aBody) ? aBody : [];
      setAllAccounts(aRows.map((a: any) => ({ id: a.id, label: a.account_name })));
    }).catch(() => toasterrormsg("Failed to load accounts."));

    // Fetch voucher number
    Get("pos/voucher/generate/", { type: "BP" }).then((res: any) => {
      const body = res?.data ?? res;
      setValue("voucherNo", body?.voucher_no ?? "");
    }).catch(() => {});

    // Load credit bills
    setLoadingBills(true);
    Promise.all([
      Get("pos/sales-return-credit-bills/"),
      Get("pos/purchase-credit-bills/"),
    ]).then(([salesRes, purchaseRes]: any[]) => {
      const sBody = salesRes?.data ?? salesRes;
      const sRows: any[] = Array.isArray(sBody?.results) ? sBody.results
        : Array.isArray(sBody?.bills) ? sBody.bills
        : Array.isArray(sBody) ? sBody : [];
      setSalesReturnBills(sRows.map(mapBill));

      const pBody = purchaseRes?.data ?? purchaseRes;
      const pRows: any[] = Array.isArray(pBody?.results) ? pBody.results
        : Array.isArray(pBody?.bills) ? pBody.bills
        : Array.isArray(pBody) ? pBody : [];
      setPurchaseEntryBills(pRows.map(mapBill));
    }).catch(() => {
      toasterrormsg("Failed to load credit bills.");
    }).finally(() => {
      setLoadingBills(false);
    });
  }, [isOpen, setValue]);

  const handleClose = () => { reset(DEFAULT_VALUES); close(); };

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      // ── Purchase Entry Credit Bill ──────────────────────────────────
      if (values.paymentType === "purchaseEntry" && values.selectedBill) {
        await Post("pos/pay-purchase-credit-bill-bank/", {
          purchase_bill_id: values.selectedBill.id,
          bank_account: values.bankAccount,
          amount: values.amount,
          date: values.date,
          mode: values.mode,
          cheque_no: values.mode === "CHEQUE" ? values.chequeNo : null,
          cheque_date: values.mode === "CHEQUE" ? values.chequeDate : null,
          cheque_clear_date: values.mode === "CHEQUE" ? values.chequeClearDate : null,
        });
        toastsuccessmsg("Purchase credit bill paid successfully.");
      }
      // ── Sales Return Credit Bill ────────────────────────────────────
      else if (values.paymentType === "salesReturn" && values.selectedBill) {
        await Post("pos/settle-credit-bill-bank/", {
          bill_id: values.selectedBill.id,
          bank_account: values.bankAccount,
          amount: values.amount,
          date: values.date,
          mode: values.mode,
          cheque_no: values.mode === "CHEQUE" ? values.chequeNo : null,
          cheque_date: values.mode === "CHEQUE" ? values.chequeDate : null,
          cheque_clear_date: values.mode === "CHEQUE" ? values.chequeClearDate : null,
        });
        toastsuccessmsg("Credit bill settled successfully.");
      }
      // ── Stock Received ──────────────────────────────────────────────
      else if (values.paymentType === "stockReceived" && values.selectedBill) {
        await Post("pos/pay-stock-received-bill-bank/", {
          stock_transfer_bill_id: values.selectedBill.id,
          bank_account: values.bankAccount,
          amount: values.amount,
          date: values.date,
          mode: values.mode,
          cheque_no: values.mode === "CHEQUE" ? values.chequeNo : null,
          cheque_date: values.mode === "CHEQUE" ? values.chequeDate : null,
          cheque_clear_date: values.mode === "CHEQUE" ? values.chequeClearDate : null,
        });
        toastsuccessmsg("Stock received payment made successfully.");
      }
      // ── Stock Return Refund ─────────────────────────────────────────
      else if (values.paymentType === "stockReturn" && values.selectedBill) {
        await Post("pos/pay-stock-return-bill-bank/", {
          stock_return_bill_id: values.selectedBill.id,
          bank_account: values.bankAccount,
          amount: values.amount,
          date: values.date,
          mode: values.mode,
          cheque_no: values.mode === "CHEQUE" ? values.chequeNo : null,
          cheque_date: values.mode === "CHEQUE" ? values.chequeDate : null,
          cheque_clear_date: values.mode === "CHEQUE" ? values.chequeClearDate : null,
        });
        toastsuccessmsg("Stock return refund paid successfully.");
      }
      // ── Manual Entry ────────────────────────────────────────────────
      else {
        const payload: any = {
          bank_account: values.bankAccount,
          op_account: values.opAccount,
          date: values.date,
          amount: values.amount,
          mode: values.mode,
          narration: values.narration || "",
          type: "BP",
        };
        if (values.mode === "CHEQUE") {
          payload.cheque_no = values.chequeNo;
          payload.cheque_date = values.chequeDate;
          payload.cheque_clear_date = values.chequeClearDate;
        }
        await Post("pos/bank-payments/", payload);
        toastsuccessmsg("Bank payment saved successfully.");
      }
      onSaved();
      handleClose();
    } catch (e: any) {
      const d = e?.response?.data;
      toasterrormsg(
        d?.detail || d?.non_field_errors?.[0] ||
        Object.values(d ?? {}).flat().join(", ") ||
        "Failed to save bank payment.",
      );
    } finally {
      setSaving(false);
    }
  };

  const MODE_OPTIONS = ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE"];

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={handleClose}>
          {/* Backdrop */}
          <TransitionChild as="div"
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
          />
          {/* Slide-over */}
          <TransitionChild as={DialogPanel}
            enter="ease-out transform-gpu transition-transform duration-200"
            enterFrom="translate-x-full" enterTo="translate-x-0"
            leave="ease-in transform-gpu transition-transform duration-200"
            leaveFrom="translate-x-0" leaveTo="translate-x-full"
            className="fixed top-0 right-0 flex h-full w-full lg:max-w-[62%] xl:max-w-[56%] transform-gpu flex-col bg-white dark:bg-dark-700"
          >
            {/* Drawer Header */}
            <div className="bg-primary flex shrink-0 items-center justify-between border-b border-primary/20 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Add Bank Payment</h3>
                <p className="mt-0.5 text-sm text-white/75">Create a new bank payment entry</p>
              </div>
              <Button onClick={handleClose} variant="flat" isIcon className="size-8 rounded-full text-white hover:bg-white/10">
                <XMarkIcon className="size-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex grow flex-col overflow-hidden">
              <div className="hide-scrollbar grow space-y-5 overflow-y-auto px-5 py-5">

                {/* ── Payment Type ───────────────────────────────────── */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-750 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-dark-200">Payment Type</h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {([
                      { value: "manual", label: "Manual Entry" },
                      { value: "salesReturn", label: "Sales Return Credit Bill" },
                      { value: "purchaseEntry", label: "Purchase Entry Credit Bill" },
                    ] as const).map(opt => (
                      <Controller key={opt.value} control={control} name="paymentType"
                        render={({ field }) => (
                          <label className="flex cursor-pointer items-center gap-2">
                            <Radio
                              color="primary"
                              checked={field.value === opt.value}
                              onChange={() => {
                                field.onChange(opt.value);
                                setValue("billNo", "");
                                setValue("selectedBill", null);
                                setValue("opAccount", null);
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-dark-200">{opt.label}</span>
                          </label>
                        )}
                      />
                    ))}

                    {/* ✅ Stock Received - Sirf normal branch users (superadmin/employee nahi) */}
                    {!isSuperAdminOrEmployee && (
                      <Controller control={control} name="paymentType"
                        render={({ field }) => (
                          <label className="flex cursor-pointer items-center gap-2">
                            <Radio
                              color="primary"
                              checked={field.value === "stockReceived"}
                              onChange={() => {
                                field.onChange("stockReceived");
                                setValue("billNo", "");
                                setValue("selectedBill", null);
                                setValue("opAccount", null);
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-dark-200">Stock Received</span>
                          </label>
                        )}
                      />
                    )}

                    {/* ✅ Stock Return refund - Superadmin OR Employee */}
                    {isSuperAdminOrEmployee && (
                      <Controller control={control} name="paymentType"
                        render={({ field }) => (
                          <label className="flex cursor-pointer items-center gap-2">
                            <Radio
                              color="primary"
                              checked={field.value === "stockReturn"}
                              onChange={() => {
                                field.onChange("stockReturn");
                                setValue("billNo", "");
                                setValue("selectedBill", null);
                                setValue("opAccount", null);
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-dark-200">Stock Return</span>
                          </label>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* ── Bill Search (Credit Bill modes) ────────────────── */}
                {(paymentType === "salesReturn" || paymentType === "purchaseEntry") && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/10 space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-400">
                      <DocumentTextIcon className="size-4" />
                      {paymentType === "salesReturn" ? "Sales Return Credit Bill" : "Purchase Entry Credit Bill"}
                    </h4>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={watch("billNo")}
                          onChange={(e) => setValue("billNo", e.target.value)}
                          placeholder="Search by Bill No..."
                          className="w-full p-2 border border-gray-300 dark:border-dark-500 rounded bg-white dark:bg-dark-800 text-gray-800 dark:text-dark-100 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBillModalType(paymentType === "salesReturn" ? "salesReturn" : "purchaseEntry");
                          setShowBillModal(true);
                        }}
                        className="bg-primary-600 text-white px-4 py-2 rounded text-sm hover:bg-primary-700 transition-colors"
                      >
                        Search Bill
                      </button>
                    </div>

                    {/* Selected bill card */}
                    {selectedBill && (paymentType === "salesReturn" || paymentType === "purchaseEntry") && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                              {(selectedBill as BillResult).billNo}
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400">
                              {(selectedBill as BillResult).partyName}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-xs text-gray-500 dark:text-dark-300">Pending</p>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                              ₹{(selectedBill as BillResult).pendingAmount.toFixed(2)}
                            </p>
                          </div>
                          <Button type="button" isIcon variant="flat"
                            className="size-6 rounded-full text-gray-400 hover:text-error-600"
                            onClick={() => { setValue("selectedBill", null); setValue("billNo", ""); setValue("opAccount", null); setValue("amount", ""); }}>
                            <XMarkIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Stock Received ────────────────────────────────── */}
                {paymentType === "stockReceived" && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/10 space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-400">
                      <BuildingLibraryIcon className="size-4" />
                      Stock Received Payment
                    </h4>
                    <StockReceivedDropdown
                      refreshKey={isOpen ? 1 : 0}
                      onSelectBill={(bill: StockReceivedBill) => {
                        setValue("billNo", bill.transfer_no);
                        setValue("selectedBill", bill);
                        setValue("amount", String(bill.pending_amount));
                        toastsuccessmsg(`Transfer ${bill.transfer_no} selected. Pending: ₹${bill.pending_amount}`);
                      }}
                    />
                    {selectedBill && paymentType === "stockReceived" && (
                      <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800/40 text-sm">
                        <p><strong className="text-gray-700 dark:text-dark-200">Transfer No:</strong> <span className="text-gray-600 dark:text-dark-300">{(selectedBill as StockReceivedBill).transfer_no}</span></p>
                        <p><strong className="text-gray-700 dark:text-dark-200">From Branch:</strong> <span className="text-gray-600 dark:text-dark-300">{(selectedBill as StockReceivedBill).from_branch_name}</span></p>
                        <p><strong className="text-gray-700 dark:text-dark-200">Party:</strong> <span className="text-gray-600 dark:text-dark-300">{(selectedBill as StockReceivedBill).main_account_name || "⚠ Sundry Creditor(Main) not created"}</span></p>
                        <p><strong className="text-gray-700 dark:text-dark-200">Pending Amount:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">₹{(selectedBill as StockReceivedBill).pending_amount.toFixed(2)}</span></p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Stock Return refund ───────────────────────────── */}
                {paymentType === "stockReturn" && (
                  <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/10 space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-400">
                      <BuildingLibraryIcon className="size-4" />
                      Stock Return Refund
                    </h4>
                    <StockReturnRefundDropdown
                      refreshKey={isOpen ? 1 : 0}
                      onSelectBill={(bill: StockReturnRefundBill) => {
                        setValue("billNo", bill.return_no);
                        setValue("selectedBill", bill);
                        setValue("amount", String(bill.pending_amount));
                        toastsuccessmsg(`Return ${bill.return_no} selected. Pending: ₹${bill.pending_amount}`);
                      }}
                    />
                    {selectedBill && paymentType === "stockReturn" && (
                      <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800/40 text-sm">
                        <p><strong className="text-gray-700 dark:text-dark-200">Return No:</strong> <span className="text-gray-600 dark:text-dark-300">{(selectedBill as StockReturnRefundBill).return_no}</span></p>
                        <p><strong className="text-gray-700 dark:text-dark-200">Branch:</strong> <span className="text-gray-600 dark:text-dark-300">{(selectedBill as StockReturnRefundBill).from_branch_name}</span></p>
                        <p><strong className="text-gray-700 dark:text-dark-200">Party:</strong> <span className="text-gray-600 dark:text-dark-300">{(selectedBill as StockReturnRefundBill).linked_account_name || "⚠ Not linked"} {(selectedBill as StockReturnRefundBill).linked_account_type && <span className="text-xs text-gray-400 dark:text-dark-400">({(selectedBill as StockReturnRefundBill).linked_account_type})</span>}</span></p>
                        <p><strong className="text-gray-700 dark:text-dark-200">Pending Amount:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">₹{(selectedBill as StockReturnRefundBill).pending_amount.toFixed(2)}</span></p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Bank Account / Voucher / Date ──────────────────── */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-750 space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
                    <BuildingLibraryIcon className="size-4" />
                    Payment Details
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Controller control={control} name="bankAccount"
                      rules={{ required: "Bank account is required" }}
                      render={({ field: { value, onChange } }) => (
                        <Listbox
                          data={bankAccounts}
                          placeholder="Select Bank Account *"
                          label={<>Bank Account <span className="text-red-500">*</span></>}
                          displayField="label"
                          value={bankAccounts.find(a => a.id === value) ?? null}
                          onChange={(item: any) => onChange(item?.id ?? null)}
                          error={(errors.bankAccount as any)?.message}
                        />
                      )}
                    />
                    <Input {...register("voucherNo")}
                      label="Voucher No"
                      prefix={<DocumentTextIcon className="size-4" />}
                      disabled
                      classNames={{ input: "h-9 text-sm" }}
                    />
                    <Controller control={control} name="date"
                      rules={{ required: "Date is required" }}
                      render={({ field }) => (
                        <DatePicker
                          label={<>Date <span className="text-red-500">*</span></>}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.date?.message}
                          placeholder="DD-MM-YYYY"
                        />
                      )}
                    />
                  </div>

                  <div className="border-t border-dashed border-primary/30 dark:border-primary/20" />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      {paymentType === "stockReceived" ? (
                        <div>
                          <label className="block text-sm font-medium mb-1">Party Name (Sundry Creditor Main)</label>
                          <div className="w-full p-2 border border-gray-300 dark:border-dark-500 rounded bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-200 text-sm">
                            {selectedBill
                              ? ((selectedBill as StockReceivedBill).main_account_name || "No Sundry Creditor(Main) account for your branch")
                              : "Select a transfer to auto-fill party"}
                          </div>
                        </div>
                      ) : paymentType === "stockReturn" ? (
                        <div>
                          <label className="block text-sm font-medium mb-1">Party Name (Linked Account)</label>
                          <div className="w-full p-2 border border-gray-300 dark:border-dark-500 rounded bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-200 text-sm">
                            {selectedBill
                              ? ((selectedBill as StockReturnRefundBill).linked_account_name || "No account linked to this branch")
                              : "Select a return to auto-fill party"}
                          </div>
                        </div>
                      ) : (
                        <Controller control={control} name="opAccount"
                          rules={{ required: paymentType === "manual" ? "Party is required" : false }}
                          render={({ field: { value, onChange } }) => (
                            <Listbox
                              data={allAccounts}
                              placeholder="Select Party *"
                              label={<>Party Name {paymentType === "manual" && <span className="text-red-500">*</span>}</>}
                              displayField="label"
                              value={allAccounts.find(a => a.id === value) ?? null}
                              onChange={(item: any) => onChange(item?.id ?? null)}
                              error={(errors.opAccount as any)?.message}
                              inputProps={{ disabled: paymentType !== "manual" }}
                            />
                          )}
                        />
                      )}
                    </div>
                    <Input
                      {...register("amount", { required: "Amount is required", min: { value: 0.01, message: "Must be > 0" } })}
                      label={<>Amount <span className="text-red-500">*</span></>}
                      type="number" step="0.01" min="0.01"
                      prefix={<CurrencyRupeeIcon className="size-4" />}
                      classNames={{ input: "h-9 text-sm" }}
                      error={errors.amount?.message}
                    />
                  </div>
                </div>

                {/* ── Mode ──────────────────────────────────────────── */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-750 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-dark-200">Mode of Payment</h4>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {MODE_OPTIONS.map(m => (
                      <Controller key={m} control={control} name="mode"
                        render={({ field }) => (
                          <label className="flex cursor-pointer items-center gap-2">
                            <Radio
                              color="primary"
                              checked={field.value === m}
                              onChange={() => field.onChange(m as FormValues["mode"])}
                            />
                            <span className="text-sm text-gray-700 dark:text-dark-200">{m}</span>
                          </label>
                        )}
                      />
                    ))}
                  </div>

                  {/* Cheque fields */}
                  {mode === "CHEQUE" && (
                    <div className="mt-2 grid gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:grid-cols-3 dark:border-amber-800/30 dark:bg-amber-900/10">
                      <Input {...register("chequeNo", { required: mode === "CHEQUE" ? "Cheque No required" : false })}
                        label={<>Cheque No <span className="text-red-500">*</span></>}
                        placeholder="Cheque number"
                        classNames={{ input: "h-9 text-sm" }}
                        error={errors.chequeNo?.message}
                      />
                      <Controller control={control} name="chequeDate"
                        rules={{ required: mode === "CHEQUE" ? "Cheque Date required" : false }}
                        render={({ field }) => (
                          <DatePicker
                            label={<>Cheque Date <span className="text-red-500">*</span></>}
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.chequeDate?.message}
                          />
                        )}
                      />
                      <Controller control={control} name="chequeClearDate"
                        render={({ field }) => (
                          <DatePicker
                            label="Cheque Clear Date"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* ── Narration ─────────────────────────────────────── */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">
                    Narration
                  </label>
                  <textarea
                    {...register("narration")}
                    rows={2}
                    placeholder="Optional narration…"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 dark:placeholder-dark-400"
                  />
                </div>

              </div>{/* end scrollable body */}

              {/* ── Footer ──────────────────────────────────────────── */}
              <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-500">
                <Button type="button" variant="outlined" className="px-6" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" color="primary" className="gap-2 px-6" disabled={saving}>
                  {saving ? (
                    <><span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving…</>
                  ) : "Save Payment"}
                </Button>
              </div>
            </form>
          </TransitionChild>
        </Dialog>
      </Transition>

      {/* ── Bill Search Modal ────────────────────────────────────────────── */}
      <BillSearchModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        onSelectBill={(bill: BillResult) => {
          setValue("billNo", bill.billNo);
          setValue("selectedBill", bill);
          setValue("opAccount", bill.partyId ?? null);
          setValue("amount", String(bill.pendingAmount));
          setShowBillModal(false);
          toastsuccessmsg(`Bill ${bill.billNo} selected. Pending amount: ₹${bill.pendingAmount}`);
        }}
        billType={billModalType}
      />
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BankPaymentPage() {
  const { canAdd, canView } = usePermission("/bank-payment");

  const [rows, setRows] = useState<BankPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filterType, setFilterType] = useState("all");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Get("pos/bank-payments/", { page: 1, page_size: 1000 }) as any;
      const body = res?.data ?? res;
      const data: any[] = Array.isArray(body?.results) ? body.results
        : Array.isArray(body?.data) ? body.data
        : Array.isArray(body) ? body : [];
      setRows(data.map(mapRow));
    } catch {
      toasterrormsg("Failed to fetch bank payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const TYPE_OPTIONS = useMemo(() =>
    ["all", ...Array.from(new Set(rows.map(r => r.type).filter(Boolean)))],
    [rows]);

  const filtered = useMemo(() => {
    if (filterType === "all") return rows;
    return rows.filter(r => r.type === filterType);
  }, [rows, filterType]);

  const grandTotal = useMemo(() =>
    filtered.reduce((s, r) => s + r.amount, 0), [filtered]);

  const handleExport = () => {
    const headers = ["#", "Date", "Type", "Voucher No", "Bank Account", "Party Name", "Amount", "Mode", "Cheque No", "Cheque Date", "Clear Date", "Narration"];
    const csvRows = filtered.map((r, i) => [
      i + 1, r.date, r.type, r.voucherNo, r.bankAccountName,
      r.partyName, r.amount, r.mode,
      r.chequeNo ?? "—", r.chequeDate ?? "—", r.chequeClearDate ?? "—", r.narration,
    ]);
    const csv = [headers, ...csvRows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "bank_payment_register.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<BankPaymentRow>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<BankPaymentRow, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">{row.index + 1}</span>
      ),
    },
    {
      id: "date", accessorKey: "date", header: "Date",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "type", accessorKey: "type", header: "Type",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => (
        <TypeBadge type={String(getValue() ?? "")} />
      ),
    },
    {
      id: "voucherNo", accessorKey: "voucherNo", header: "Voucher No",
      cell: ({ getValue, table }: CellContext<BankPaymentRow, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="whitespace-nowrap font-medium text-primary-600 dark:text-primary-400 text-xs">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "bankAccountName", accessorKey: "bankAccountName", header: "Bank Account",
      cell: ({ getValue, table }: CellContext<BankPaymentRow, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-gray-800 dark:text-dark-100">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "partyName", accessorKey: "partyName", header: "Party Name",
      cell: ({ getValue, table }: CellContext<BankPaymentRow, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="text-gray-700 dark:text-dark-200">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "amount", accessorKey: "amount", header: "Amount",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => (
        <span className="font-bold tabular-nums text-primary-600 dark:text-primary-400">
          ₹{Number(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "mode", accessorKey: "mode", header: "Mode",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => (
        <ModeBadge mode={String(getValue() ?? "")} />
      ),
    },
    {
      id: "chequeNo", accessorKey: "chequeNo", header: "Cheque No",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => (
        <span className="text-xs text-gray-500 dark:text-dark-300">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
    {
      id: "chequeDate", accessorKey: "chequeDate", header: "Cheque Date",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => {
        const v = getValue();
        return (
          <span className="whitespace-nowrap text-gray-500 dark:text-dark-300">
            {v ? formatDateDDMMYYYY(String(v)) : "—"}
          </span>
        );
      },
    },
    {
      id: "chequeClearDate", accessorKey: "chequeClearDate", header: "Clear Date",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => {
        const v = getValue();
        return (
          <span className="whitespace-nowrap text-gray-500 dark:text-dark-300">
            {v ? formatDateDDMMYYYY(String(v)) : "—"}
          </span>
        );
      },
    },
    {
      id: "narration", accessorKey: "narration", header: "Narration",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => (
        <span className="block max-w-[150px] truncate text-gray-500 dark:text-dark-300">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
    {
      id: "createdByName", accessorKey: "createdByName", header: "Created By",
      cell: ({ getValue }: CellContext<BankPaymentRow, unknown>) => (
        <span className="text-xs text-gray-500 dark:text-dark-300">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter, sorting, rowSelection },
    enableRowSelection: true,
    getRowId: (row) => String(row.id),
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <Page title="Bank Payment Register">
      <div className="transition-content w-full pb-8">

        {/* ── Toolbar ───────────────────────────────────────────────────── */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Bank Payment Register
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              <span className="font-semibold text-gray-800 dark:text-dark-100">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              records
              {filtered.length > 0 && (
                <> · Total: <span className="font-semibold text-primary-600 dark:text-primary-400">₹{grandTotal.toLocaleString()}</span></>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={handleExport}>
              <ArrowDownTrayIcon className="size-4 text-success-600" />
              <span>Export Excel</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={() => window.print()}>
              <PrinterIcon className="size-4" />
              <span>Print</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={fetchRows} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            {canAdd && (
              <Button color="primary" className="h-9 gap-2 rounded-md px-4 text-sm" onClick={() => setDrawerOpen(true)}>
                <PlusIcon className="size-4" />
                <span>Add Bank Payment</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── Summary card ──────────────────────────────────────────────── */}
        <div className="px-(--margin-x) mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <BanknotesIcon className="size-4 text-white" />
            </div>
            <p className="text-xl font-bold tabular-nums">₹{grandTotal.toLocaleString()}</p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Total Amount</p>
          </div>
          {/* Counts per type */}
          {["BP", "PBP", "SRBP", "STBP", "STRBP"].map(t => {
            const count = rows.filter(r => r.type === t).length;
            const bgMap: Record<string, string> = {
              BP: "bg-gradient-to-br from-emerald-500 to-emerald-700",
              PBP: "bg-gradient-to-br from-sky-500 to-sky-700",
              SRBP: "bg-gradient-to-br from-amber-500 to-amber-600",
              STBP: "bg-gradient-to-br from-cyan-500 to-cyan-700",
              STRBP: "bg-gradient-to-br from-purple-500 to-purple-700",
            };
            return (
              <div key={t} className={clsx("relative overflow-hidden rounded-xl p-4 text-white shadow-md", bgMap[t] || "bg-gray-500")}>
                <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
                <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
                  <CurrencyRupeeIcon className="size-4 text-white" />
                </div>
                <p className="text-xl font-bold tabular-nums">{count}</p>
                <p className="mt-0.5 text-xs font-medium text-white/80">{t} Entries</p>
              </div>
            );
          })}
        </div>

        {/* ── Search + Type filter ───────────────────────────────────────── */}
        <div className="px-(--margin-x) mt-4 flex flex-wrap items-center gap-3">
          <div className="max-w-xs flex-1">
            <Input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
              prefix={<MagnifyingGlassIcon className="size-4" />}
              classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
              placeholder="Search by Voucher No, Bank Account, Party, Mode…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map(t => (
              <button key={t} onClick={() => setFilterType(t)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                  filterType === t
                    ? "bg-primary text-white"
                    : "border border-gray-300 bg-white text-gray-600 hover:border-primary hover:text-primary dark:border-dark-500 dark:bg-dark-700 dark:text-dark-200",
                )}>
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={loading ? "Loading bank payments…" : "No bank payments found."}
        />
      </div>

      {/* ── Drawer ────────────────────────────────────────────────────── */}
      <AddBankPaymentDrawer
        isOpen={drawerOpen}
        close={() => setDrawerOpen(false)}
        onSaved={fetchRows}
      />
    </Page>
  );
}