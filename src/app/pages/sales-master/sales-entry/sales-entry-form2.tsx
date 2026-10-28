// src/app/pages/sales-master/sales-entry/sales-entry-form2.tsx
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  DocumentCheckIcon,
  DocumentTextIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PrinterIcon,
  QrCodeIcon,
  Squares2X2Icon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { DatePicker } from "@/components/shared/form/DatePicker";
import { Badge, Button, Input, Textarea } from "@/components/ui";
import { Get, Post, toastsuccessmsg, toasterrormsg } from "@/ApiHelper";
import { useBranchLocationCheck } from "@/hooks/useBranchLocationCheck";

import { CustomerModal } from "./CustomerModal";
import { SaleReceiptModal } from "./SaleReceiptModal";
import { ProductCard } from "./ProductCard";
import { CartRow } from "./CartRow";
import { ReferralCodeInput } from "./ReferralCodeInput";
import {
  Customer,
  GridCartItem,
  PaymentTerm,
  SaleItem,
  VARIANT_BY_BRANCH,
  mapApiCustomer,
  mapGridRow,
} from "./data";

const today = new Date().toISOString().split("T")[0];
const ITEMS_PAGE_SIZE = 50;
const PAYMENT_TERMS: PaymentTerm[] = [
  { id: "Cash", label: "Cash" },
  { id: "Bank", label: "Bank" },
  { id: "Credit", label: "Credit" },
];

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export default function SalesEntryForm2() {
  const navigate = useNavigate();
  const { checkLocation, isLoading: locationLoading } = useBranchLocationCheck();

  // ── cart ──────────────────────────────────────────────────────────────
  const [addedItems, setAddedItems] = useState<GridCartItem[]>([]);
  const [idCounter, setIdCounter] = useState(1);

  // ── items (server-paged) ─────────────────────────────────────────────
  const [items, setItems] = useState<SaleItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsHasMore, setItemsHasMore] = useState(false);
  const [itemsTotal, setItemsTotal] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchType, setBranchType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const itemsReqId = useRef(0);

  // ── barcode ──────────────────────────────────────────────────────────
  const [barcodeValue, setBarcodeValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // ── customers + accounts ─────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; label: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  // ── form fields ──────────────────────────────────────────────────────
  const [date, setDate] = useState(today);
  const [billNo, setBillNo] = useState("");
  const [terms, setTerms] = useState<PaymentTerm>(PAYMENT_TERMS[0]);
  const [dueDate, setDueDate] = useState("");
  const [narration, setNarration] = useState("");
  const [freightCharge, setFreightCharge] = useState("");
  const [otherExpense, setOtherExpense] = useState("");
  const [roundAmount, setRoundAmount] = useState("");
  const [referralCode, setReferralCode] = useState("");

  // ── ui ───────────────────────────────────────────────────────────────
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [savedSaleId, setSavedSaleId] = useState<number | null>(null);
  const [submitAction, setSubmitAction] = useState<null | "save" | "print">(
    null,
  );
  const isSubmitting = submitAction !== null;

  // ── items loader (paginated, 50 at a time) ───────────────────────────
  const loadItemsPage = useCallback(async (query: string, offset: number) => {
    const reqId = ++itemsReqId.current;
    setItemsLoading(true);
    try {
      const res: any = await Get("pos/sale-search-item/", {
        ...(query ? { query } : {}),
        limit: ITEMS_PAGE_SIZE + 1,
        offset,
      });
      if (reqId !== itemsReqId.current) return;

      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body?.results)
        ? body.results
        : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

      const mapped = rows.map(mapGridRow);
      const page = mapped.slice(0, ITEMS_PAGE_SIZE);

      setItems((prev) => (offset > 0 ? [...prev, ...page] : page));
      setItemsHasMore(mapped.length > ITEMS_PAGE_SIZE);

      if (typeof body?.count === "number") {
        setItemsTotal(body.count);
      } else {
        setItemsTotal((prev) =>
          offset > 0 ? (prev ?? 0) + page.length : page.length,
        );
      }
    } catch {
      if (reqId === itemsReqId.current) toasterrormsg("Failed to load items");
    } finally {
      if (reqId === itemsReqId.current) setItemsLoading(false);
    }
  }, []);

  // initial bootstrap (branch, voucher, default customer, customers)
  useEffect(() => {
    Get("pos/user-branch/")
      .then((r: any) => setBranchType((r?.data ?? r)?.branch_type ?? null))
      .catch(() => { });

    Get("pos/voucher/generate/?type=SI")
      .then((r: any) => setBillNo((r?.data ?? r)?.voucher_no ?? ""))
      .catch(() => toasterrormsg("Voucher no failed"));

    Get("pos/default-customer/")
      .then((r: any) => {
        const d = (r?.data ?? r)?.customer ?? (r?.data ?? r);
        if (d?.id) setCustomer(mapApiCustomer(d));
      })
      .catch(() => { });

    Get("pos/customers/")
      .then((r: any) => {
        const body = r?.data ?? r;
        const rows: any[] = Array.isArray(body?.results)
          ? body.results
          : Array.isArray(body)
            ? body
            : [];
        setCustomers(rows.map(mapApiCustomer));
      })
      .catch(() => { });
  }, []);

  // initial items load once branchType known
  useEffect(() => {
    if (!branchType) return;
    loadItemsPage("", 0);
  }, [branchType, loadItemsPage]);

  // debounced search → reload from offset 0
  useEffect(() => {
    if (!branchType) return;
    const t = setTimeout(() => {
      loadItemsPage(searchTerm.trim(), 0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm, branchType, loadItemsPage]);

  // accounts by terms
  useEffect(() => {
    if (!terms || terms.id === "Credit") {
      setAccounts([]);
      setSelectedAccount(null);
      return;
    }
    setAccountLoading(true);
    Get(`pos/account-terms-type/?terms=${terms.id}`)
      .then((r: any) => {
        const body = r?.data ?? r;
        const rows: any[] = Array.isArray(body)
          ? body
          : Array.isArray(body?.results)
            ? body.results
            : [];
        setAccounts(
          rows.map((a: any) => ({
            id: String(a.id),
            label: a.account_name ?? a.name ?? "",
          })),
        );
        setSelectedAccount(null);
      })
      .catch(() => { })
      .finally(() => setAccountLoading(false));
  }, [terms]);

  // ── recalc one line ─────────────────────────────────────────────────
  const recalcItem = async (
    item: GridCartItem,
    patches: Partial<GridCartItem>,
  ): Promise<GridCartItem> => {
    const merged = { ...item, ...patches };
    try {
      const r: any = await Post("pos/sale-item-tax/", {
        item_id: merged.itemId,
        customer_id: customer?.id,
        qty: Number(merged.quantity),
        price: Number(merged.price),
        discount_percent: Number(merged.discountPercent) || 0,
      });
      const d = r?.data ?? r;
      return {
        ...merged,
        basicAmount: Number(d.basic_amount).toFixed(2),
        discountAmount: Number(d.discount_amount).toFixed(2),
        taxAmount: Number(d.total_tax).toFixed(2),
        netValue: Number(d.net_amount).toFixed(2),
        cgst: Number(d.cgst).toFixed(2),
        sgst: Number(d.sgst).toFixed(2),
        igst: Number(d.igst).toFixed(2),
      };
    } catch {
      return merged;
    }
  };

  const updateItem = async (id: number, patches: Partial<GridCartItem>) => {
    const item = addedItems.find((i) => i.id === id);
    if (!item) return;
    const updated = await recalcItem(item, patches);
    setAddedItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  // ── add to cart ─────────────────────────────────────────────────────
  const addItemToCart = useCallback(
    async (row: SaleItem) => {
      if (!customer?.id) {
        toasterrormsg("Select a customer first");
        return;
      }
      if (row.stock <= 0) {
        toasterrormsg(`"${row.itemName}" out of stock`);
        return;
      }

      let price = row.salesPrice;
      if (row.unitSupportsFractional && row.perUnitPrice > 0)
        price = row.perUnitPrice;

      const existing = addedItems.find(
        (i) => i.itemId === row.itemId && i.variantId === row.id,
      );
      if (existing) {
        await updateItem(existing.id, { quantity: existing.quantity + 1 });
        toastsuccessmsg(`+1 ${row.itemName}`);
        return;
      }

      try {
        const r: any = await Post("pos/sale-item-tax/", {
          item_id: row.itemId,
          customer_id: customer.id,
          qty: 1,
          price,
          discount_percent: 0,
        });
        const d = r?.data ?? r;
        setAddedItems((prev) => [
          ...prev,
          {
            id: idCounter,
            itemId: row.itemId,
            variantId: row.id,
            itemName: row.itemName,
            hsnCode: row.hsn,
            quantity: 1,
            price,
            per: row.unit,
            taxSlab: String(row.taxPercent),
            discountPercent: 0,
            basicAmount: Number(d.basic_amount).toFixed(2),
            discountAmount: Number(d.discount_amount).toFixed(2),
            taxAmount: Number(d.total_tax).toFixed(2),
            netValue: Number(d.net_amount).toFixed(2),
            cgst: Number(d.cgst).toFixed(2),
            sgst: Number(d.sgst).toFixed(2),
            igst: Number(d.igst).toFixed(2),
          },
        ]);
        setIdCounter((p) => p + 1);
        toastsuccessmsg(`✓ ${row.itemName}`);
      } catch {
        toasterrormsg("Failed to add item");
      }
    },
    [customer, addedItems, idCounter],
  );

  // ── barcode ──────────────────────────────────────────────────────────
  const handleBarcodeSearch = async (barcode: string) => {
    const b = barcode.trim();
    if (!b) return;
    if (!customer?.id) {
      toasterrormsg("Select customer first");
      setBarcodeValue("");
      return;
    }
    setScanning(true);
    try {
      const local = items.find(
        (i) => i.barcode && i.barcode.toLowerCase() === b.toLowerCase(),
      );
      if (local) {
        await addItemToCart(local);
        return;
      }
      const r: any = await Get("pos/sale-search-item/", { barcode: b });
      const body = r?.data ?? r;
      const row = Array.isArray(body) ? body[0] : null;
      if (row) {
        await addItemToCart(mapGridRow(row));
      } else {
        toasterrormsg(`No item with barcode "${b}"`);
      }
    } catch {
      toasterrormsg("Barcode search failed");
    } finally {
      setBarcodeValue("");
      setScanning(false);
      barcodeRef.current?.focus();
    }
  };

  // ── totals ───────────────────────────────────────────────────────────
  const totals = {
    totalBasic: addedItems.reduce((s, i) => s + Number(i.basicAmount || 0), 0),
    totalDiscount: addedItems.reduce(
      (s, i) => s + Number(i.discountAmount || 0),
      0,
    ),
    totalTax: addedItems.reduce((s, i) => s + Number(i.taxAmount || 0), 0),
    totalNet: addedItems.reduce((s, i) => s + Number(i.netValue || 0), 0),
    totalCgst: addedItems.reduce((s, i) => s + Number(i.cgst || 0), 0),
    totalSgst: addedItems.reduce((s, i) => s + Number(i.sgst || 0), 0),
    totalIgst: addedItems.reduce((s, i) => s + Number(i.igst || 0), 0),
  };
  const grandTotal =
    totals.totalNet +
    Number(freightCharge || 0) +
    Number(otherExpense || 0) +
    Number(roundAmount || 0);

  // ── build payload ────────────────────────────────────────────────────
  const buildPayload = () => {
    const freight = Number(freightCharge || 0);
    const other = Number(otherExpense || 0);
    const round = Number(roundAmount || 0);
    const gt = totals.totalNet + freight + other + round;
    const payload: any = {
      date,
      customer: Number(customer?.id),
      payment_terms: terms.id,
      narration: narration || "",
      cash_account: null,
      bank_account: null,
      dueDate: terms.id === "Credit" ? dueDate : "",
      total_basic: totals.totalBasic,
      total_discount: totals.totalDiscount,
      total_tax: totals.totalTax,
      grand_total: gt,
      frightcharge: freight,
      otherexpnse: other,
      roundamount: round,
      referral_code: referralCode || null,
      items: addedItems.map((it) => ({
        item_id: it.itemId,
        variant_id: it.variantId,
        hsn_code: it.hsnCode,
        qty: Number(it.quantity),
        price: Number(it.price),
        unit: it.per,
        discount_percent: Number(it.discountPercent),
        tax_percent: Number(it.taxSlab) || 0,
        basic_amount: Number(it.basicAmount),
        discount_amount: Number(it.discountAmount),
        tax_amount: Number(it.taxAmount),
        net_amount: Number(it.netValue),
        cgst: it.cgst,
        sgst: it.sgst,
        igst: it.igst,
      })),
    };
    if (terms.id === "Cash") payload.cash_account = Number(selectedAccount?.id);
    if (terms.id === "Bank") payload.bank_account = Number(selectedAccount?.id);
    return payload;
  };

  const validateCart = (): string | null => {
    if (addedItems.length === 0) return "Add at least one item";
    if (!customer?.id) return "Select customer";
    if ((terms.id === "Cash" || terms.id === "Bank") && !selectedAccount)
      return "Select account";
    if (terms.id === "Credit" && !dueDate) return "Choose due date";
    return null;
  };

  // ── save / save+print ────────────────────────────────────────────────
  const handleFinish = async () => {
    if (isSubmitting) return;
    const ok = await checkLocation();
    if (!ok) return;
    const err = validateCart();
    if (err) {
      toasterrormsg(err);
      return;
    }
    setSubmitAction("save");
    toastsuccessmsg("Saving sale & sending receipt email... please wait.");
    try {
      const r: any = await Post("pos/salesentry-create/", buildPayload());
      toastsuccessmsg("Sale saved successfully!");
      const stockAlerts = (r?.data ?? r)?.stock_alerts;
      if (stockAlerts) stockAlerts.forEach((m: any) => toasterrormsg(m));
      setAddedItems([]);
      setIdCounter(1);
      navigate("/sales-entry");
    } catch {
      toasterrormsg("Error saving sale");
    } finally {
      setSubmitAction(null);
    }
  };

  const handlePrint = async () => {
    if (isSubmitting) return;
    const ok = await checkLocation();
    if (!ok) return;
    const err = validateCart();
    if (err) {
      toasterrormsg(err);
      return;
    }
    setSubmitAction("print");
    toastsuccessmsg("Saving sale & sending receipt email... please wait.");
    try {
      const r: any = await Post("pos/salesentry-create/", buildPayload());
      toastsuccessmsg("Sale saved successfully!");
      const stockAlerts = (r?.data ?? r)?.stock_alerts;
      if (stockAlerts) stockAlerts.forEach((m: any) => toasterrormsg(m));
      setSavedSaleId(Number((r?.data ?? r)?.id ?? 0));
      setAddedItems([]);
      setIdCounter(1);
      setShowReceiptModal(true);
    } catch {
      toasterrormsg("Error saving sale");
    } finally {
      setSubmitAction(null);
    }
  };

  const customerOptions = customers.map((c) => ({
    id: String(c.id),
    label: c.name,
  }));
  const customerValue = customer
    ? { id: String(customer.id), label: customer.name }
    : null;

  const handleCustomerAdded = (c: Customer) => {
    setCustomers((prev) => [...prev, c]);
    setCustomer(c);
  };

  // ── render ───────────────────────────────────────────────────────────
  return (
    <Page title="Sales Entry (POS)">
      <div className="transition-content w-full pb-8">
        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              className="h-8 gap-2 rounded-md px-3 text-sm"
              onClick={() => navigate("/sales-entry")}
            >
              <ChevronLeftIcon className="size-4" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Sales Entry (POS)
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">
                Click items to add · Scan barcode to add · Finish & print
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="px-(--margin-x) mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_460px] xl:grid-cols-[1fr_520px]">
          {/* LEFT — items panel */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-500 dark:bg-dark-750 overflow-hidden">
            {/* search + toggle + barcode */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-600 space-y-3 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                  <Input
                    placeholder="Search by name, HSN, barcode, size, color..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    classNames={{ input: "h-10 pl-9 text-sm" }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 dark:bg-dark-700">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={clsx(
                        "p-2 rounded-md transition",
                        viewMode === "grid"
                          ? "bg-white shadow text-primary dark:bg-dark-600"
                          : "text-gray-400 dark:text-dark-400",
                      )}
                    >
                      <Squares2X2Icon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={clsx(
                        "p-2 rounded-md transition",
                        viewMode === "list"
                          ? "bg-white shadow text-primary dark:bg-dark-600"
                          : "text-gray-400 dark:text-dark-400",
                      )}
                    >
                      <ListBulletIcon className="size-4" />
                    </button>
                  </div>
                  <Badge
                    variant="soft"
                    color="primary"
                    className="text-xs font-semibold"
                  >
                    {itemsTotal === null
                      ? `${items.length} items`
                      : `${items.length} of ${itemsTotal} items`}
                  </Badge>
                </div>
              </div>

              {/* barcode */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-primary size-4" />
                  {scanning && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  <Input
                    ref={barcodeRef}
                    value={barcodeValue}
                    onChange={(e) => setBarcodeValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBarcodeSearch(barcodeValue);
                      }
                    }}
                    placeholder="Scan barcode here (Enter to confirm)"
                    classNames={{ input: "h-10 pl-9 text-sm" }}
                    disabled={scanning}
                  />
                </div>
                <Button
                  onClick={() => handleBarcodeSearch(barcodeValue)}
                  disabled={scanning || !barcodeValue.trim()}
                  color="primary"
                >
                  <QrCodeIcon className="size-4" /> Scan
                </Button>
              </div>
            </div>

            {/* grid / list body */}
            <div className="flex-1 p-4 max-h-[70vh] overflow-y-auto">
              {viewMode === "grid" ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        onAdd={addItemToCart}
                        branchType={branchType}
                      />
                    ))}
                    {items.length === 0 && !itemsLoading && (
                      <div className="col-span-full flex flex-col items-center py-20 text-gray-300 dark:text-dark-500">
                        <TagIcon className="size-12" />
                        <p className="mt-3 text-sm font-medium">
                          No items found
                        </p>
                      </div>
                    )}
                  </div>
                  {itemsHasMore && (
                    <div className="mt-4 text-center">
                      <Button
                        type="button"
                        variant="outlined"
                        className="h-9 rounded-lg px-6 text-sm"
                        onClick={() =>
                          loadItemsPage(searchTerm.trim(), items.length)
                        }
                        disabled={itemsLoading}
                      >
                        {itemsLoading
                          ? "Loading..."
                          : `Load more (50 at a time)`}
                      </Button>
                    </div>
                  )}
                  {!itemsHasMore && items.length > 0 && (
                    <p className="text-center text-xs text-gray-400 mt-4">
                      All items loaded
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-primary text-white">
                        <tr>
                          {[
                            "Item",
                            "HSN",
                            "Barcode",
                            ...(VARIANT_BY_BRANCH[branchType || ""] || []).map(
                              (f) => f.charAt(0).toUpperCase() + f.slice(1),
                            ),
                            "Unit",
                            "Price",
                            "Tax%",
                            "Stock",
                            "Add",
                          ].map((h) => (
                            <th
                              key={h}
                              className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr
                            key={item.id}
                            className={clsx(
                              "border-b border-gray-100 hover:bg-primary/[0.03] dark:border-dark-700",
                              item.stock <= 0 && "opacity-40",
                            )}
                          >
                            <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-dark-100">
                              {item.itemName}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500">
                              {item.hsn}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-primary">
                              {item.barcode || "-"}
                            </td>
                            {(VARIANT_BY_BRANCH[branchType || ""] || []).map(
                              (f) => (
                                <td
                                  key={f}
                                  className="px-3 py-2.5 text-xs text-gray-600 dark:text-dark-200"
                                >
                                  {(item as any)[f] ?? "-"}
                                </td>
                              ),
                            )}
                            <td className="px-3 py-2.5 text-xs text-gray-500">
                              {item.unit}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-primary">
                              ₹{Number(item.salesPrice).toFixed(2)}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-info-600 font-semibold">
                              {item.taxPercent}%
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Badge
                                color={
                                  item.stock > 5
                                    ? "success"
                                    : item.stock > 0
                                      ? "warning"
                                      : "error"
                                }
                                variant="soft"
                                className="text-xs font-bold"
                              >
                                {item.stock}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Button
                                type="button"
                                onClick={() => addItemToCart(item)}
                                disabled={item.stock <= 0}
                                color="primary"
                                className="h-7 gap-1 rounded-md px-2 text-xs"
                              >
                                <PlusIcon className="size-3" /> Add
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {items.length === 0 && !itemsLoading && (
                          <tr>
                            <td
                              colSpan={20}
                              className="py-10 text-center text-gray-400"
                            >
                              No items found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {itemsHasMore && (
                    <div className="mt-4 text-center">
                      <Button
                        type="button"
                        variant="outlined"
                        className="h-9 rounded-lg px-6 text-sm"
                        onClick={() =>
                          loadItemsPage(searchTerm.trim(), items.length)
                        }
                        disabled={itemsLoading}
                      >
                        {itemsLoading
                          ? "Loading..."
                          : `Load more (50 at a time)`}
                      </Button>
                    </div>
                  )}
                  {!itemsHasMore && items.length > 0 && (
                    <p className="text-center text-xs text-gray-400 mt-4">
                      All items loaded
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT — billing panel */}
          <div className="rounded-2xl border border-gray-200 bg-primary/5 shadow-sm dark:border-dark-500 dark:bg-dark-750 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/70 dark:bg-dark-800/70 dark:border-dark-600">
              <h3 className="text-sm font-black text-primary flex items-center gap-2">
                <DocumentTextIcon className="size-4" /> Billing
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAddedItems([]);
                  setIdCounter(1);
                }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <XMarkIcon className="size-3" /> RESET
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[65vh]">
              <div className="px-4 py-4 border-b border-gray-200 bg-white/50 space-y-3 dark:bg-dark-800/50 dark:border-dark-600">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="size-3" /> Date
                      </span>
                    </FieldLabel>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      placeholder="Select date"
                    />
                  </div>
                  <div>
                    <FieldLabel>Invoice No</FieldLabel>
                    <div className="flex h-10 items-center rounded-xl border border-gray-200 bg-primary/5 px-3.5 text-xs text-primary dark:border-dark-500 dark:bg-dark-800 dark:text-primary-400">
                      {billNo || "Auto"}
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel required>Customer</FieldLabel>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Listbox
                        data={customerOptions}
                        placeholder="Select Customer"
                        value={customerValue}
                        onChange={(item: any) => {
                          const found = customers.find(
                            (c) => String(c.id) === item?.id,
                          );
                          if (found) setCustomer(found);
                        }}
                        displayField="label"
                      />
                    </div>
                    <Button
                      color="primary"
                      className="h-10"
                      onClick={() => setShowAddCustomer(true)}
                    >
                      <PlusIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Payment</FieldLabel>
                    <Listbox
                      data={PAYMENT_TERMS}
                      placeholder="Select Terms"
                      value={terms}
                      onChange={(item: any) => {
                        setTerms(item);
                        setSelectedAccount(null);
                        setDueDate("");
                      }}
                      displayField="label"
                    />
                  </div>
                  {terms.id === "Credit" ? (
                    <div>
                      <FieldLabel>Due Date</FieldLabel>
                      <DatePicker
                        value={dueDate}
                        onChange={setDueDate}
                        placeholder="Select"
                      />
                    </div>
                  ) : (
                    <div>
                      <FieldLabel required>Account</FieldLabel>
                      <Listbox
                        data={accounts}
                        placeholder={`Select ${terms.label}`}
                        value={selectedAccount}
                        onChange={(item: any) => setSelectedAccount(item)}
                        displayField="label"
                        disabled={accountLoading}
                      />
                    </div>
                  )}
                </div>

                {terms.id === "Credit" && (
                  <div>
                    <FieldLabel required>Account</FieldLabel>
                    <Listbox
                      data={accounts}
                      placeholder="Select Account"
                      value={selectedAccount}
                      onChange={(item: any) => setSelectedAccount(item)}
                      displayField="label"
                      disabled={accountLoading}
                    />
                  </div>
                )}

                <ReferralCodeInput
                  value={referralCode}
                  onChange={setReferralCode}
                  onVerified={() => { }}
                />
              </div>

              <div className="px-4">
                {addedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-primary/20 dark:text-primary/10">
                    <TagIcon className="size-12" />
                    <p className="mt-3 text-sm text-primary/40 dark:text-primary/30">
                      Cart is empty
                    </p>
                    <p className="text-xs text-primary/30 dark:text-primary/20 mt-1">
                      Click items to add
                    </p>
                  </div>
                ) : (
                  addedItems.map((item) => (
                    <CartRow
                      key={item.id}
                      item={item}
                      onQtyChange={(id, qty) =>
                        updateItem(id, { quantity: qty })
                      }
                      onPriceChange={(id, price) =>
                        updateItem(id, { price })
                      }
                      onDiscountChange={(id, disc) =>
                        updateItem(id, { discountPercent: disc })
                      }
                      onDelete={(id) =>
                        setAddedItems((prev) =>
                          prev.filter((i) => i.id !== id),
                        )
                      }
                    />
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 bg-white/80 dark:bg-dark-800/80 dark:border-dark-600 mt-2">
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">
                    Additional Charges
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: "Freight",
                        value: freightCharge,
                        onChange: setFreightCharge,
                      },
                      {
                        label: "Other Exp",
                        value: otherExpense,
                        onChange: setOtherExpense,
                      },
                      {
                        label: "Round Off",
                        value: roundAmount,
                        onChange: setRoundAmount,
                      },
                    ].map(({ label, value, onChange }) => (
                      <div key={label}>
                        <label className="text-[10px] text-gray-500 dark:text-dark-400 block mb-1 font-medium">
                          {label}
                        </label>
                        <Input
                          type="number"
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          placeholder="0"
                          classNames={{ input: "h-9 text-xs text-center" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 space-y-2 border-t border-gray-100 dark:border-dark-600">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-dark-400 font-medium">
                      Subtotal (Taxable)
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-dark-200">
                      ₹{totals.totalBasic.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-dark-400 font-medium">
                      Total Discount
                    </span>
                    <span className="font-semibold text-success-600 dark:text-success-400">
                      -₹{totals.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                  {totals.totalCgst > 0 || totals.totalSgst > 0 ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-dark-400 font-medium">
                        CGST + SGST
                      </span>
                      <span className="font-semibold text-info-600 dark:text-info-400">
                        ₹{(totals.totalCgst + totals.totalSgst).toFixed(2)}
                      </span>
                    </div>
                  ) : totals.totalIgst > 0 ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-dark-400 font-medium">
                        IGST
                      </span>
                      <span className="font-semibold text-info-600 dark:text-info-400">
                        ₹{totals.totalIgst.toFixed(2)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-dark-400 font-medium">
                      Estimated Tax
                    </span>
                    <span className="font-semibold text-info-600 dark:text-info-400">
                      ₹{totals.totalTax.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mx-4 mb-3 flex items-center justify-between bg-primary rounded-xl px-4 py-3 shadow-lg">
                  <span className="text-xs font-bold text-white/90 uppercase tracking-wide">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black text-white">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

                <div className="px-4 pb-4">
                  <Textarea
                    value={narration}
                    onChange={(e: any) => setNarration(e.target.value)}
                    placeholder="Narration (optional)"
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-750 p-3 grid grid-cols-2 gap-2">
              <Button
                onClick={handleFinish}
                disabled={isSubmitting || locationLoading}
                className="gap-2"
              >
                {submitAction === "save" ? (
                  <>
                    <span className="size-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <DocumentCheckIcon className="size-4" /> SAVE
                  </>
                )}
              </Button>
              <Button
                onClick={handlePrint}
                disabled={isSubmitting}
                color="primary"
                className="gap-2"
              >
                {submitAction === "print" ? (
                  <>
                    <span className="size-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <PrinterIcon className="size-4" /> FINISH & PRINT
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CustomerModal
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSelect={(c) => handleCustomerAdded(c)}
      />

      {showReceiptModal && savedSaleId && (
        <SaleReceiptModal
          saleId={savedSaleId}
          open={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            navigate("/sales-entry");
          }}
        />
      )}
    </Page>
  );
}