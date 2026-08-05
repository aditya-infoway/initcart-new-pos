/**
 * New Purchase Entry page
 * Route: /pos/purchase/purchase-entry/new
 * API endpoints (unchanged from old admin):
 *   GET  pos/voucher/generate/?type=PI
 *   GET  pos/account-terms-type/?terms=Cash|Bank
 *   GET  pos/account-type/?group=Supplier
 *   GET  pos/purchase-item-all/
 *   GET  pos/purchse-item-search/?query=...
 *   POST pos/purchase-item-tax/
 *   POST pos/purchase-create/
 *   GET  pos/user-branch/
 */
import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  ArrowLeftIcon, CheckCircleIcon, CubeIcon,
  CurrencyRupeeIcon, DocumentTextIcon,
  MagnifyingGlassIcon, PlusIcon, PrinterIcon,
  TrashIcon, TruckIcon, XMarkIcon,
  BuildingLibraryIcon, BanknotesIcon, CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Input } from "@/components/ui";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { DatePicker } from "@/components/shared/form/Datepicker";
import { Get, Post, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";

// ── Types ──────────────────────────────────────────────────────────────────
type Terms = "Credit" | "Cash" | "Bank";

interface AccountOption { id: number; label: string; }
interface ModalItem {
  id: number;          // variant id
  itemId: number;
  itemName: string;
  hsnCode: string;
  purchasePrice: number;
  unit: string;
  unit_supports_fractional: boolean;
  taxSlab: string;
  barcode: string;
  size: string;
  color: string;
}

interface AddedItem {
  uid: number;
  itemId: number;
  variantId: number;
  itemName: string;
  hsnCode: string;
  quantity: number;
  altQuantity: number;
  price: number;
  unit: string;
  discountPercent: number;
  basicAmount: number;
  discountAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  netValue: number;
  taxSlab: string;
}

interface FormValues {
  date:           string;
  terms:          AccountOption | null;
  account:        AccountOption | null;
  partyName:      AccountOption | null;
  purchaseBillNo: string;
  billNo:         string;
  dueDate:        string;
  narration:      string;
  freightCharge:  string;
  otherExpense:   string;
  roundAmount:    string;
  // current item row
  curQty:         string;
  curPrice:       string;
  curDiscount:    string;
}

const TERMS_OPTIONS: AccountOption[] = [
  { id: 1, label: "Credit" },
  { id: 2, label: "Cash"   },
  { id: 3, label: "Bank"   },
];

const today = new Date().toISOString().split("T")[0];

// ── ReadField ─────────────────────────────────────────────────────────────
function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">{label}</label>
      <div className="flex h-9 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-200">
        {value || "—"}
      </div>
    </div>
  );
}

// ── Item Pick Modal ────────────────────────────────────────────────────────
function ItemPickModal({
  isOpen, onClose, onPick,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPick: (item: ModalItem) => void;
}) {
  const [query, setQuery]     = useState("");
  const [dq, setDq]           = useState("");
  const [items, setItems]     = useState<ModalItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDq(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let rows: any[] = [];
      if (dq) {
        const res = await Get("pos/purchse-item-search/", { query: dq }) as any;
        rows = res?.data ?? res ?? [];
        if (!Array.isArray(rows)) rows = rows?.results ?? [];
      } else {
        const res = await Get("pos/purchase-item-all/") as any;
        rows = res?.data ?? res ?? [];
        if (!Array.isArray(rows)) rows = rows?.results ?? [];
      }
      setItems(rows.map((r: any) => ({
        id:                      Number(r.id ?? 0),
        itemId:                  Number(r.itemId ?? r.item_id ?? 0),
        itemName:                String(r.itemName ?? r.item_name ?? ""),
        hsnCode:                 String(r.hsnCode ?? r.hsn_code ?? ""),
        purchasePrice:           Number(r.purchasePrice ?? r.purchase_price ?? 0),
        unit:                    String(r.unit ?? ""),
        unit_supports_fractional: Boolean(r.unit_supports_fractional),
        taxSlab:                 String(r.taxSlab ?? r.tax_slab ?? "0"),
        barcode:                 String(r.barcode ?? ""),
        size:                    String(r.size ?? ""),
        color:                   String(r.color ?? ""),
      })));
    } catch { toasterrormsg("Failed to load items."); }
    finally  { setLoading(false); }
  }, [dq]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, dq, load]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[210]" onClose={onClose}>
        <TransitionChild as="div"
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm dark:bg-black/50"
        />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild as={DialogPanel}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-700"
            >
              <div className="flex items-center justify-between bg-primary px-5 py-4">
                <h3 className="text-base font-bold text-white">Select Item</h3>
                <Button onClick={onClose} variant="flat" isIcon className="size-8 rounded-full text-white hover:bg-white/10">
                  <XMarkIcon className="size-5" />
                </Button>
              </div>
              <div className="border-b border-gray-200 px-5 py-3 dark:border-dark-500">
                <Input value={query} onChange={e => setQuery(e.target.value)}
                  prefix={<MagnifyingGlassIcon className="size-4" />}
                  placeholder="Search item, HSN, barcode…"
                  classNames={{ input: "h-9 text-sm" }} autoFocus
                />
              </div>
              <div className="max-h-[55vh] overflow-y-auto overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-400">No items found.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100 dark:bg-dark-800">
                      <tr>
                        {["Item Name","HSN","Barcode","Size","Color","Unit","Tax%","Price",""].map(h => (
                          <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={`${item.itemId}-${item.id}`}
                          className="border-t border-gray-100 hover:bg-gray-50 dark:border-dark-600 dark:hover:bg-dark-600">
                          <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-dark-100">{item.itemName}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{item.hsnCode || "—"}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{item.barcode || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-dark-200">{item.size || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-dark-200">{item.color || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-dark-200">{item.unit}</td>
                          <td className="px-4 py-2.5"><Badge color="warning" variant="soft" className="text-xs">{item.taxSlab}%</Badge></td>
                          <td className="px-4 py-2.5 tabular-nums font-medium text-gray-700 dark:text-dark-200">₹{Number(item.purchasePrice).toFixed(2)}</td>
                          <td className="px-4 py-2.5">
                            <Button color="primary" className="h-7 rounded-md px-3 text-xs"
                              onClick={() => { onPick(item); onClose(); }}>
                              Select
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex justify-end border-t border-gray-200 px-5 py-3 dark:border-dark-500">
                <Button variant="outlined" className="px-6" onClick={onClose}>Close</Button>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function NewPurchasePage() {
  const navigate = useNavigate();

  // accounts
  const [suppliers, setSuppliers]       = useState<AccountOption[]>([]);
  const [cashAccounts, setCashAccounts] = useState<AccountOption[]>([]);
  const [bankAccounts, setBankAccounts] = useState<AccountOption[]>([]);

  // current item row (selected from modal)
  const [curItem, setCurItem]   = useState<ModalItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // added items
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);
  const [uidCounter, setUidCounter] = useState(1);
  const [saving, setSaving]         = useState(false);

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        date: today, terms: null, account: null, partyName: null,
        purchaseBillNo: "", billNo: "", dueDate: "", narration: "",
        freightCharge: "", otherExpense: "", roundAmount: "",
        curQty: "", curPrice: "", curDiscount: "",
      },
      mode: "onTouched",
    });

  const termsVal   = watch("terms");
  const curQty     = watch("curQty");
  const curPrice   = watch("curPrice");
  const curDisc    = watch("curDiscount");
  const freight    = Number(watch("freightCharge") || 0);
  const other      = Number(watch("otherExpense")  || 0);
  const roundAmt   = Number(watch("roundAmount")   || 0);
  const termsLabel = termsVal?.label ?? "";

  // load data on mount
  useEffect(() => {
    Promise.all([
      Get("pos/account-type/", { group: "Supplier" }),
      Get("pos/account-terms-type/", { terms: "cash" }),
      Get("pos/account-terms-type/", { terms: "bank" }),
      Get("pos/voucher/generate/", { type: "PI" }),
    ]).then(([supRes, cashRes, bankRes, voucherRes]: any[]) => {
      const toOpts = (r: any) => {
        const body = r?.data ?? r;
        const rows = Array.isArray(body) ? body : (body?.results ?? []);
        return rows.map((a: any) => ({ id: a.id, label: a.account_name }));
      };
      setSuppliers(toOpts(supRes));
      setCashAccounts(toOpts(cashRes));
      setBankAccounts(toOpts(bankRes));
      const vBody = (voucherRes as any)?.data ?? voucherRes;
      if (vBody?.voucher_no) setValue("billNo", vBody.voucher_no);
    }).catch(() => toasterrormsg("Failed to load form data."));
  }, [setValue]);

  // reload cash/bank accounts when terms changes
  useEffect(() => {
    setValue("account", null);
    if (!termsLabel || termsLabel === "Credit") return;
    const t = termsLabel.toLowerCase();
    Get("pos/account-terms-type/", { terms: t }).then((res: any) => {
      const body = res?.data ?? res;
      const rows = Array.isArray(body) ? body : (body?.results ?? []);
      const opts = rows.map((a: any) => ({ id: a.id, label: a.account_name }));
      if (t === "cash") setCashAccounts(opts);
      else setBankAccounts(opts);
    }).catch(() => {});
  }, [termsLabel, setValue]);

  const accountOptions = termsLabel === "Cash" ? cashAccounts
    : termsLabel === "Bank" ? bankAccounts : [];

  // live calculation for current row
  const liveBasic  = (Number(curQty) || 0) * (Number(curPrice) || 0);
  const liveDisc   = liveBasic * (Number(curDisc) || 0) / 100;
  const liveNet    = liveBasic - liveDisc;

  // totals
  const totals = useMemo(() => ({
    totalBasic:    addedItems.reduce((s, i) => s + i.basicAmount, 0),
    totalDiscount: addedItems.reduce((s, i) => s + i.discountAmount, 0),
    totalTax:      addedItems.reduce((s, i) => s + i.taxAmount, 0),
    totalNet:      addedItems.reduce((s, i) => s + i.netValue, 0),
    totalCgst:     addedItems.reduce((s, i) => s + i.cgst, 0),
    totalSgst:     addedItems.reduce((s, i) => s + i.sgst, 0),
    totalIgst:     addedItems.reduce((s, i) => s + i.igst, 0),
  }), [addedItems]);

  const grandTotal = totals.totalNet + freight + other + roundAmt;

  // pick item from modal
  const handlePickItem = (item: ModalItem) => {
    setCurItem(item);
    setValue("curPrice",    String(item.purchasePrice));
    setValue("curQty",      "");
    setValue("curDiscount", "");
  };

  // add item row
  const handleAddItem = async () => {
    const party = watch("partyName");
    if (!party)   { toasterrormsg("Select Party Name first."); return; }
    if (!curItem) { toasterrormsg("Select an item first."); return; }
    const qty  = Number(curQty);
    const price = Number(curPrice);
    if (!qty || qty <= 0)   { toasterrormsg("Enter a valid quantity."); return; }
    if (!price || price <= 0) { toasterrormsg("Enter a valid price."); return; }

    try {
      const res = await Post("pos/purchase-item-tax/", {
        item_id:          curItem.itemId,
        party_id:         party.id,
        qty,
        price,
        discount_percent: Number(curDisc || 0),
      }) as any;
      const d = res?.data ?? res;
      setAddedItems(prev => [...prev, {
        uid:            uidCounter,
        itemId:         curItem.itemId,
        variantId:      curItem.id,
        itemName:       curItem.itemName,
        hsnCode:        curItem.hsnCode,
        quantity:       qty,
        altQuantity:    0,
        price,
        unit:           curItem.unit,
        discountPercent: Number(curDisc || 0),
        basicAmount:    Number(d.basic_amount ?? liveBasic),
        discountAmount: Number(d.discount_amount ?? liveDisc),
        taxAmount:      Number(d.total_tax ?? 0),
        cgst:           Number(d.cgst ?? 0),
        sgst:           Number(d.sgst ?? 0),
        igst:           Number(d.igst ?? 0),
        netValue:       Number(d.net_amount ?? liveNet),
        taxSlab:        String(d.tax_percent ?? curItem.taxSlab),
      }]);
      setUidCounter(p => p + 1);
      setCurItem(null);
      setValue("curQty", ""); setValue("curPrice", ""); setValue("curDiscount", "");
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.message ?? "Tax calculation failed.");
    }
  };

  // submit
  const onSubmit = async (values: FormValues) => {
    if (addedItems.length === 0) { toasterrormsg("Add at least one item."); return; }
    setSaving(true);
    try {
      const payload: any = {
        billNo:            values.billNo,
        date:              values.date,
        dueDate:           values.dueDate || null,
        party_name:        values.partyName?.id,
        terms:             termsLabel,
        narration:         values.narration || "",
        purchasebill_no:   values.purchaseBillNo || "",
        total_basic:       totals.totalBasic,
        total_tax:         totals.totalTax,
        total_net:         totals.totalNet,
        grand_total:       grandTotal,
        frightcharge:      freight,
        otherexpnse:       other,
        roundamount:       roundAmt,
        bank_account:      termsLabel === "Bank"  ? values.account?.id : null,
        case_account:      termsLabel === "Cash"  ? values.account?.id : null,
        items: addedItems.map(i => ({
          itemName:        i.itemId,
          variant:         i.variantId,
          hsnCode:         i.hsnCode,
          quantity:        i.quantity,
          altQuantity:     i.altQuantity,
          price:           i.price,
          per:             i.unit,
          discountPercent: i.discountPercent,
          basicAmount:     i.basicAmount,
          discountAmount:  i.discountAmount,
          taxAmount:       i.taxAmount,
          netValue:        i.netValue,
          cgst:            i.cgst,
          sgst:            i.sgst,
          igst:            i.igst,
        })),
      };
      await Post("pos/purchase-create/", payload);
      toastsuccessmsg("Purchase saved successfully.");
      navigate("/pos/purchase/purchase-entry");
    } catch (e: any) {
      const d = e?.response?.data;
      toasterrormsg(d?.non_field_errors?.[0] ?? d?.detail ?? Object.values(d ?? {}).flat().join(", ") ?? "Failed to save purchase.");
    } finally { setSaving(false); }
  };

  return (
    <Page title="New Purchase Entry">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="transition-content w-full pb-32 space-y-6">

          {/* ── Page Header ─────────────────────────────────────────── */}
          <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-1">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outlined" className="h-8 gap-2 rounded-md px-3 text-sm"
                onClick={() => navigate("/pos/purchase/purchase-entry")}>
                <ArrowLeftIcon className="size-4" /> Back
              </Button>
              <div>
                <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">New Purchase Entry</h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">Fill in details, add items, then save</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 dark:bg-primary/10">
              <DocumentTextIcon className="size-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs text-gray-500 dark:text-dark-300">Bill No:</span>
              <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">{watch("billNo") || "Auto"}</span>
            </div>
          </div>

          {/* ── Bill Details ─────────────────────────────────────────── */}
          <div className="px-(--margin-x)">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-500 dark:bg-dark-750">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-dark-600">
                <CalendarDaysIcon className="size-4 text-primary-500" />
                <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400">Bill Details</h4>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Controller control={control} name="date" rules={{ required: "Required" }}
                    render={({ field }) => (
                      <DatePicker label={<>Date <span className="text-red-500">*</span></>}
                        value={field.value} onChange={field.onChange} error={errors.date?.message} />
                    )}
                  />
                  <Controller control={control} name="terms" rules={{ required: "Required" }}
                    render={({ field: { value, onChange } }) => (
                      <Listbox data={TERMS_OPTIONS} displayField="label" placeholder="Select Terms *"
                        label={<>Terms <span className="text-red-500">*</span></>}
                        value={value ?? null} onChange={onChange}
                        error={(errors.terms as any)?.message} />
                    )}
                  />
                  {termsLabel && termsLabel !== "Credit" && (
                    <Controller control={control} name="account" rules={{ required: "Required" }}
                      render={({ field: { value, onChange } }) => (
                        <Listbox data={accountOptions} displayField="label"
                          placeholder={`Select ${termsLabel} Account *`}
                          label={<>{termsLabel === "Cash"
                            ? <><BanknotesIcon className="mr-1 inline size-3.5 text-emerald-500" />Cash Account</>
                            : <><BuildingLibraryIcon className="mr-1 inline size-3.5 text-sky-500" />Bank Account</>}
                            {" "}<span className="text-red-500">*</span></>}
                          value={value ?? null} onChange={onChange}
                          error={(errors.account as any)?.message} />
                      )}
                    />
                  )}
                  <Controller control={control} name="partyName" rules={{ required: "Required" }}
                    render={({ field: { value, onChange } }) => (
                      <Listbox data={suppliers} displayField="label" placeholder="Select Supplier *"
                        label={<>Party Name <span className="text-red-500">*</span></>}
                        value={value ?? null} onChange={onChange}
                        error={(errors.partyName as any)?.message} />
                    )}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input {...register("purchaseBillNo")} label="Purchase Bill No." placeholder="Supplier's bill no."
                    prefix={<DocumentTextIcon className="size-4" />} classNames={{ input: "h-9 text-sm" }} />
                  <ReadField label="Bill No. (Auto)" value={watch("billNo")} />
                  {termsLabel === "Credit" && (
                    <Controller control={control} name="dueDate"
                      render={({ field }) => (
                        <DatePicker label="Due Date" value={field.value} onChange={field.onChange} />
                      )}
                    />
                  )}
                  <div className={clsx(termsLabel === "Credit" ? "" : "sm:col-span-2")}>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">Narration</label>
                    <textarea {...register("narration")} rows={1} placeholder="Optional notes…"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Item Entry ───────────────────────────────────────────── */}
          <div className="px-(--margin-x)">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-500 dark:bg-dark-750">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-dark-600">
                <div className="flex items-center gap-2">
                  <CubeIcon className="size-4 text-primary-500" />
                  <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400">Item Entry</h4>
                </div>
                <Button type="button" color="primary" variant="soft" className="h-8 gap-2 rounded-lg px-3 text-xs"
                  onClick={() => setModalOpen(true)}>
                  <MagnifyingGlassIcon className="size-3.5" /> Select Item
                </Button>
              </div>
              <div className="p-5 space-y-4">
                {curItem ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 dark:bg-primary/10">
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-semibold text-gray-800 dark:text-dark-100">{curItem.itemName}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-300">
                        HSN: {curItem.hsnCode || "—"} · Unit: {curItem.unit} · Tax: {curItem.taxSlab}%
                        {curItem.size ? ` · Size: ${curItem.size}` : ""}
                        {curItem.color ? ` · Color: ${curItem.color}` : ""}
                      </p>
                    </div>
                    <Badge color="warning" variant="soft" className="text-xs">{curItem.taxSlab}% GST</Badge>
                    <Button type="button" isIcon variant="flat" className="size-6 rounded-full text-gray-400 hover:text-error-600"
                      onClick={() => { setCurItem(null); setValue("curQty",""); setValue("curPrice",""); setValue("curDiscount",""); }}>
                      <XMarkIcon className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-400 dark:border-dark-500 dark:text-dark-400">
                    <CubeIcon className="size-5 opacity-40" />
                    Click "Select Item" above to choose an item
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
                  <Input {...register("curPrice")} label="Price ₹" type="number" step="0.01" min="0"
                    prefix={<CurrencyRupeeIcon className="size-4" />}
                    classNames={{ input: "h-9 text-sm" }} disabled={!curItem} />
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input {...register("curQty")} type="number" step="0.001" min="0" disabled={!curItem} placeholder="0"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 dark:disabled:bg-dark-600" />
                  </div>
                  <Input {...register("curDiscount")} label="Discount %" type="number" step="0.01" min="0" max="100" placeholder="0"
                    classNames={{ input: "h-9 text-sm" }} disabled={!curItem} />
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-dark-500 dark:bg-dark-800">
                    <p className="text-xs text-gray-400 dark:text-dark-400">Basic Amount</p>
                    <p className="mt-0.5 text-base font-bold text-primary-600 dark:text-primary-400">
                      ₹{liveBasic > 0 ? liveBasic.toFixed(2) : "0.00"}
                    </p>
                    {liveDisc > 0 && <p className="text-xs text-gray-400">After disc: ₹{liveNet.toFixed(2)}</p>}
                  </div>
                  <Button type="button" color="primary" className="h-9 gap-2 rounded-lg px-5 text-sm"
                    onClick={handleAddItem} disabled={!curItem}>
                    <PlusIcon className="size-4" /> Add to List
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Added items table ─────────────────────────────────────── */}
          <div className="px-(--margin-x)">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-500 dark:bg-dark-750">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-dark-600">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-dark-200">Items Added</h4>
                  {addedItems.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary-600 dark:bg-primary/20 dark:text-primary-400">
                      {addedItems.length}
                    </span>
                  )}
                </div>
                {addedItems.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Net Total: ₹{totals.totalNet.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto" style={{ maxHeight: "320px" }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-primary">
                    <tr>
                      {["#","Item Name","HSN","Qty","Price","Unit","Tax%","Disc%","Basic","Tax Amt","Net Amt",""].map(h => (
                        <th key={h} className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-white">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {addedItems.length === 0 ? (
                      <tr><td colSpan={12} className="py-14 text-center">
                        <CubeIcon className="mx-auto mb-3 size-10 text-gray-200 dark:text-dark-600" />
                        <p className="text-sm text-gray-400">No items added yet</p>
                        <p className="mt-1 text-xs text-gray-300">Select an item above and click "Add to List"</p>
                      </td></tr>
                    ) : addedItems.map((item, idx) => (
                      <tr key={item.uid} className="border-t border-gray-100 transition hover:bg-primary/5 dark:border-dark-600 dark:hover:bg-primary/10">
                        <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800 dark:text-dark-100">{item.itemName}</p>
                          <p className="text-xs text-gray-400">{item.unit}</p>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{item.hsnCode || "—"}</td>
                        <td className="px-4 py-2.5 font-semibold tabular-nums">{item.quantity}</td>
                        <td className="px-4 py-2.5 tabular-nums text-gray-600 dark:text-dark-200">₹{item.price.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-gray-500">{item.unit}</td>
                        <td className="px-4 py-2.5"><Badge color="warning" variant="soft" className="text-xs">{item.taxSlab}%</Badge></td>
                        <td className="px-4 py-2.5 text-gray-500">{item.discountPercent}%</td>
                        <td className="px-4 py-2.5 tabular-nums font-medium text-primary-600 dark:text-primary-400">₹{item.basicAmount.toFixed(2)}</td>
                        <td className="px-4 py-2.5 tabular-nums font-medium text-amber-600">₹{item.taxAmount.toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-bold tabular-nums text-primary-600 dark:text-primary-400">₹{item.netValue.toFixed(2)}</td>
                        <td className="px-4 py-2.5">
                          <Button type="button" isIcon variant="flat" className="size-7 rounded-full hover:bg-error-50 dark:hover:bg-error-900/20"
                            onClick={() => setAddedItems(p => p.filter(i => i.uid !== item.uid))}>
                            <TrashIcon className="size-3.5 text-error-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {addedItems.length > 0 && (
                    <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-dark-800">
                      <tr className="border-t-2 border-gray-200 dark:border-dark-500">
                        <td colSpan={8} className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-500">Totals</td>
                        <td className="px-4 py-2.5 font-bold tabular-nums text-primary-600 dark:text-primary-400">₹{totals.totalBasic.toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-bold tabular-nums text-amber-600">₹{totals.totalTax.toFixed(2)}</td>
                        <td className="px-4 py-2.5 font-bold tabular-nums text-primary-600 dark:text-primary-400">₹{totals.totalNet.toFixed(2)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* ── Charges + Payment Summary ────────────────────────────── */}
          <div className="px-(--margin-x) grid gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-500 dark:bg-dark-750">
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3 dark:border-dark-600">
                <TruckIcon className="size-4 text-primary-500" />
                <h4 className="text-sm font-semibold text-primary-600 dark:text-primary-400">Additional Charges</h4>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <Input {...register("freightCharge")} label="Freight Charge" type="number" step="0.01" min="0" placeholder="0.00"
                  prefix={<TruckIcon className="size-4" />} classNames={{ input: "h-9 text-sm" }} />
                <Input {...register("otherExpense")} label="Other Expense" type="number" step="0.01" min="0" placeholder="0.00"
                  classNames={{ input: "h-9 text-sm" }} />
                <Input {...register("roundAmount")} label="Round Off" type="number" step="0.01" placeholder="0.00"
                  classNames={{ input: "h-9 text-sm" }} />
              </div>
            </div>
            <div className="lg:col-span-2 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-50 via-white to-sky-50 p-5 shadow-sm dark:border-primary/20 dark:from-primary/10 dark:via-dark-750 dark:to-sky-900/10">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-dark-100">Payment Summary</h4>
                {termsLabel && (
                  <Badge color={termsLabel === "Credit" ? "warning" : termsLabel === "Cash" ? "success" : "info"} variant="soft" className="text-xs">{termsLabel}</Badge>
                )}
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Total Basic",    value: totals.totalBasic.toFixed(2)    },
                  { label: "Total Discount", value: totals.totalDiscount.toFixed(2) },
                  { label: "Taxable Value",  value: (totals.totalBasic - totals.totalDiscount).toFixed(2) },
                  ...(totals.totalCgst > 0 ? [
                    { label: "CGST", value: totals.totalCgst.toFixed(2) },
                    { label: "SGST", value: totals.totalSgst.toFixed(2) },
                  ] : totals.totalIgst > 0 ? [
                    { label: "IGST", value: totals.totalIgst.toFixed(2) },
                  ] : [{ label: "Total Tax", value: totals.totalTax.toFixed(2) }]),
                  { label: "Net (incl. Tax)", value: totals.totalNet.toFixed(2), bold: true },
                  { label: "Freight",   value: freight.toFixed(2)  },
                  { label: "Other Exp", value: other.toFixed(2)    },
                  { label: "Round Off", value: roundAmt.toFixed(2) },
                ].map(({ label, value, bold }: any) => (
                  <div key={label} className={clsx(
                    "flex items-center justify-between py-1.5",
                    bold ? "border-y border-primary/20 font-semibold" : "border-b border-gray-100 dark:border-dark-600",
                  )}>
                    <span className={bold ? "text-gray-700 dark:text-dark-100" : "text-gray-500 dark:text-dark-300"}>{label}</span>
                    <span className={bold ? "text-primary-700 dark:text-primary-300" : "text-gray-600 dark:text-dark-200"}>₹{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-primary px-4 py-3 mt-2">
                  <span className="font-semibold text-white/90 text-sm">Grand Total</span>
                  <span className="text-xl font-bold text-white tabular-nums">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Sticky footer ────────────────────────────────────────── */}
        <div className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-dark-500 dark:bg-dark-700/95">
          <Button type="button" variant="outlined"
            className="h-9 gap-2 rounded-lg px-5 text-sm text-error-600 border-error-300 hover:bg-error-50 dark:border-error-700 dark:hover:bg-error-900/20"
            onClick={() => { setAddedItems([]); setCurItem(null); }}>
            <TrashIcon className="size-4" /> Clear All
          </Button>
          <Button type="button" variant="outlined" className="h-9 gap-2 rounded-lg px-4 text-sm"
            onClick={() => window.print()}>
            <PrinterIcon className="size-4" /> Print
          </Button>
          <Button type="button" variant="outlined" className="h-9 gap-2 rounded-lg px-4 text-sm"
            onClick={() => navigate("/pos/purchase/purchase-entry")}>
            <ArrowLeftIcon className="size-4" /> Cancel
          </Button>
          <Button type="submit" color="primary" className="h-9 gap-2 rounded-lg px-8 text-sm font-semibold"
            disabled={saving || addedItems.length === 0}>
            {saving
              ? <><span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving…</>
              : <><CheckCircleIcon className="size-4" />Save Purchase</>}
          </Button>
        </div>
      </form>

      <ItemPickModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onPick={handlePickItem} />
    </Page>
  );
}
