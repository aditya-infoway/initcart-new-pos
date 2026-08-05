import {
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  PlusIcon,
  ArrowDownOnSquareIcon,
  QrCodeIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  TrashIcon,
  TruckIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Listbox } from "@/components/shared/form/StyledListbox";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import { Get, Post, toastsuccessmsg, toasterrormsg } from "@/ApiHelper";
import {
  CartLine,
  Customer,
  SaleItem,
  calcCartLine,
  calcSummary,
  mapApiSaleItem,
} from "./data";
import { ItemSelectorModal } from "./ItemSelectorModal";
import { CustomerModal } from "./CustomerModal";

// ── Field label helper ────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

// ── Read-only display field ───────────────────────────────────────────────────
function ReadField({ value, className }: { value: React.ReactNode; className?: string }) {
  return (
    <div className={clsx(
      "flex h-10 items-center rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-700 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-200",
      className,
    )}>
      {value || <span className="text-gray-400">—</span>}
    </div>
  );
}

// ── Section card header ───────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color = "text-primary" }: {
  icon: React.ComponentType<any>; title: string; color?: string;
}) {
  return (
    <div className={clsx("mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 dark:border-dark-600", color)}>
      <Icon className="size-4" />
      <span className="text-sm font-semibold">{title}</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NewSalePage() {
  const navigate = useNavigate();
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Bill details
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [billNo, setBillNo] = useState("");
  const [narration, setNarration] = useState("");
  const [terms, setTerms] = useState<{ id: string; label: string } | null>(null);
  const [termOptions, setTermOptions] = useState([
    { id: "Cash", label: "Cash" },
    { id: "Credit", label: "Credit" },
  ]);
  const [cashAccount, setCashAccount] = useState<{ id: string; label: string } | null>(null);
  const [cashAccounts, setCashAccounts] = useState<{ id: string; label: string }[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Item entry
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [discPercent, setDiscPercent] = useState(0);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [allItems, setAllItems] = useState<SaleItem[]>([]);

  // Additional charges
  const [freight, setFreight] = useState(0);
  const [otherExpense, setOtherExpense] = useState(0);
  const [roundAmt, setRoundAmt] = useState(0);

  // Modals & state
  const [itemModal, setItemModal] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountError, setAccountError] = useState(false);

  // ── Load initial data ───────────────────────────────────────────────────────
  useEffect(() => {
    Get("pos/voucher/generate/?type=SI").then((res: any) => {
      setBillNo(res?.data?.voucher_no ?? res?.data ?? "");
    }).catch(() => {});

    Get("pos/default-customer/").then((res: any) => {
      const d = res?.data?.customer ?? res?.data;
      if (d) setCustomer({ id: Number(d.id), name: d.name ?? d.account_name ?? "Default Customer", mobile: "", email: "", address: "" });
    }).catch(() => {});

    Get("pos/account-terms-type/?terms=Cash").then((res: any) => {
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body) ? body : Array.isArray(body?.results) ? body.results : [];
      const mapped = rows.map((r: any) => ({ id: String(r.id), label: r.account_name ?? r.name ?? "" }));
      setCashAccounts(mapped);
    }).catch(() => {});

    Get("pos/sale-search-item/").then((res: any) => {
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body?.results) ? body.results : Array.isArray(body) ? body : [];
      setAllItems(rows.map(mapApiSaleItem));
    }).catch(() => {});
  }, []);

  // ── Item handlers ───────────────────────────────────────────────────────────
  const handleSelectItem = (item: SaleItem) => {
    setSelectedItem(item);
    setPrice(item.salesPrice);
    setQty(1);
    setDiscPercent(0);
  };

  const handleBarcodeEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const found = allItems.find(i => i.barcode === barcodeInput.trim());
    if (found) { handleSelectItem(found); setBarcodeInput(""); }
    else toasterrormsg("Item not found for this barcode.");
  };

  const handleAdd = () => {
    if (!selectedItem) { toasterrormsg("Please select an item first."); return; }
    if (qty < 1) { toasterrormsg("Qty must be at least 1."); return; }
    const line = calcCartLine(selectedItem, qty, price, discPercent);
    setCart(prev => [...prev, line]);
    setSelectedItem(null); setQty(1); setPrice(0); setDiscPercent(0);
  };

  const removeCartLine = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const updateCartQty = (idx: number, delta: number) => {
    setCart(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const nq = Math.max(1, l.qty + delta);
      return calcCartLine(
        { id: l.saleItemId, itemName: l.itemName, hsn: l.hsn, barcode: l.barcode,
          size: l.size, color: l.color, salesPrice: l.price, stock: 999,
          unit: l.unit, taxPercent: l.taxPercent, variantId: l.variantId },
        nq, l.price, l.discPercent,
      );
    }));
  };

  const summary = calcSummary(cart, freight, otherExpense, roundAmt);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!cashAccount) { setAccountError(true); toasterrormsg("Please select a cash account."); return; }
    if (cart.length === 0) { toasterrormsg("Add at least one item."); return; }
    setSaving(true);
    try {
      const payload = {
        date,
        bill_no: billNo,
        narration,
        terms: terms?.id ?? "Cash",
        cash_account: cashAccount.id,
        customer_id: customer?.id,
        freight,
        other_expense: otherExpense,
        round_off: roundAmt,
        items: cart.map(l => ({
          item_id: l.saleItemId,
          variant_id: l.variantId,
          qty: l.qty,
          price: l.price,
          disc_percent: l.discPercent,
        })),
      };
      await Post("pos/salesentry-list/", payload);
      toastsuccessmsg("Sale saved successfully.");
      navigate("/pos/sales/sales-entry-report");
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.message || e?.response?.data?.detail || "Failed to save sale.");
    } finally {
      setSaving(false);
    }
  };

  const netValue = selectedItem
    ? ((price * qty) * (1 - discPercent / 100) * (1 + selectedItem.taxPercent / 100)).toFixed(2)
    : "0.00";

  return (
    <Page title="Sales Entry Form">
      <div className="transition-content w-full px-(--margin-x) py-5 space-y-5 pb-10">

        {/* ── Top Bar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="outlined" className="h-9 gap-2 px-4 text-sm"
            onClick={() => navigate("/pos/sales/sales-entry-report")}>
            ← Back
          </Button>
          <div className="flex items-center gap-2.5 rounded-full bg-primary px-6 py-2">
            <ShoppingCartIcon className="size-4 text-white" />
            <span className="text-sm font-bold uppercase tracking-widest text-white">Sales Entry Form</span>
          </div>
          <Button color="primary" className="h-9 gap-2 px-5 text-sm font-semibold" onClick={handleSave} disabled={saving}>
            <ArrowDownOnSquareIcon className="size-4" />
            {saving ? "Saving..." : "Save Sale"}
          </Button>
        </div>

        {/* ── Bill Details ─────────────────────────────────────────────────── */}
        <Card className="p-5">
          <SectionHeader icon={DocumentTextIcon} title="Bill Details" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

            {/* Date */}
            <div>
              <FieldLabel>Date</FieldLabel>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                prefix={<CalendarDaysIcon className="size-4" />}
              />
            </div>
            {/* Bill No */}
            <div>
              <FieldLabel>Bill No.</FieldLabel>
              <Input
                value={billNo || "Auto Generated"}
                readOnly
                prefix={<DocumentTextIcon className="size-4" />}
                classNames={{ input: "bg-gray-50 dark:bg-dark-800 cursor-default" }}
              />
            </div>

            {/* Customer */}
            <div>
              <FieldLabel>Customer</FieldLabel>
              <div className="flex gap-2">
                <Input
                  value={customer?.name ?? ""}
                  readOnly
                  placeholder="No customer selected"
                  prefix={<UserPlusIcon className="size-4" />}
                  classNames={{ input: "bg-gray-50 dark:bg-dark-800 cursor-default flex-1" }}
                />
                <Button color="primary" className="h-10 shrink-0 gap-1 px-3 text-sm"
                  onClick={() => setCustomerModal(true)}>
                  <PlusIcon className="size-3.5" /> Add
                </Button>
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <FieldLabel>Payment Terms</FieldLabel>
              <Listbox
                data={termOptions}
                placeholder="Select Terms"
                value={terms}
                onChange={(item: any) => setTerms(item)}
                displayField="label"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Cash Account */}
            <div>
              <FieldLabel required>Cash Account</FieldLabel>
              <Listbox
                data={cashAccounts}
                placeholder="Select Cash Account"
                value={cashAccount}
                onChange={(item: any) => { setCashAccount(item); setAccountError(false); }}
                displayField="label"
                error={accountError}
              />
              {accountError && (
                <p className="mt-1 text-xs text-error">Account is required</p>
              )}
            </div>

            {/* Narration */}
            <div>
              <FieldLabel>Narration</FieldLabel>
              <Textarea
                value={narration}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNarration(e.target.value)}
                placeholder="Optional notes..."
                rows={2}
              />
            </div>
          </div>
        </Card>

        {/* ── Barcode Scanner ───────────────────────────────────────────────── */}
        <Card className="p-5">
          <SectionHeader icon={QrCodeIcon} title="Barcode Scanner" color="text-indigo-600 dark:text-indigo-400" />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeEnter}
                placeholder="Scan barcode here — cursor must be here to scan"
                prefix={<QrCodeIcon className="size-4" />}
                suffix={
                  <button onClick={() => barcodeRef.current?.focus()}
                    className="grid size-6 place-items-center rounded text-gray-400 hover:text-primary transition-colors">
                    <QrCodeIcon className="size-4" />
                  </button>
                }
              />
            </div>
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-dark-400">
            ✓ Keep cursor in this field and scan — item will be selected automatically
          </p>
        </Card>

        {/* ── Item Entry ────────────────────────────────────────────────────── */}
        <Card className="p-5">
          <SectionHeader icon={ShoppingCartIcon} title="Item Entry" />

          {/* Selected item info bar */}
          {selectedItem && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 dark:bg-primary/10">
              <span className="text-xs font-semibold text-primary">Selected:</span>
              <span className="text-sm font-bold text-gray-800 dark:text-dark-100">{selectedItem.itemName}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{selectedItem.variant ?? "Default"}</span>
              <span className="text-xs text-gray-500">Barcode: <span className="font-mono">{selectedItem.barcode}</span></span>
              <span className="text-xs text-gray-500">Stock: <span className="font-semibold text-emerald-600">{selectedItem.stock}</span></span>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            {/* Select button */}
            <div>
              <FieldLabel>Item</FieldLabel>
              <Button color="primary" className="h-10 gap-2 rounded-xl px-4 text-sm"
                onClick={() => setItemModal(true)}>
                <MagnifyingGlassIcon className="size-4" /> Select Item
              </Button>
            </div>

            {/* HSN */}
            <div className="w-28">
              <FieldLabel>HSN Code</FieldLabel>
              <ReadField value={selectedItem?.hsn} />
            </div>

            {/* Qty */}
            <div className="w-24">
              <FieldLabel>Qty</FieldLabel>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                classNames={{ input: "text-center font-semibold" }}
              />
            </div>

            {/* Price */}
            <div className="w-28">
              <FieldLabel>Price</FieldLabel>
              <Input
                type="number"
                min={0}
                value={price}
                onChange={e => setPrice(Number(e.target.value))}
                prefix={<CurrencyRupeeIcon className="size-4" />}
              />
            </div>

            {/* Unit */}
            <div className="w-20">
              <FieldLabel>Unit</FieldLabel>
              <ReadField value={selectedItem?.unit} />
            </div>

            {/* Disc% */}
            <div className="w-24">
              <FieldLabel>Disc%</FieldLabel>
              <Input
                type="number"
                min={0}
                max={100}
                value={discPercent}
                onChange={e => setDiscPercent(Number(e.target.value))}
                suffix={<span className="text-xs text-gray-400">%</span>}
              />
            </div>

            {/* Tax% */}
            <div className="w-20">
              <FieldLabel>Tax%</FieldLabel>
              <ReadField
                value={<span className="font-semibold text-amber-600">{selectedItem?.taxPercent ?? 0}%</span>}
              />
            </div>

            {/* Net Value */}
            <div className="w-28">
              <FieldLabel>Net Value</FieldLabel>
              <ReadField
                value={<span className="font-bold text-primary">₹{netValue}</span>}
              />
            </div>

            {/* Add button */}
            <div>
              <FieldLabel>&nbsp;</FieldLabel>
              <Button color="primary" className="h-10 gap-2 rounded-xl px-5 text-sm font-semibold"
                onClick={handleAdd} disabled={!selectedItem}>
                <PlusIcon className="size-4" /> Add
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Cart Table ────────────────────────────────────────────────────── */}
        {cart.length > 0 && (
          <Card className="overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-3 dark:border-dark-600">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100">
                Cart — {cart.length} item{cart.length > 1 ? "s" : ""}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-primary text-white">
                    {["#","Item","HSN","Qty","Price","Unit","Tax%","Disc%","Basic","Disc Amt","Tax Amt","Net","Del"].map(h => (
                      <th key={h} className="whitespace-nowrap px-3 py-3 text-xs font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cart.map((l, i) => (
                    <tr key={i} className="border-b border-gray-100 transition-colors hover:bg-primary/[0.03] dark:border-dark-700 dark:hover:bg-primary/10">
                      <td className="px-3 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-gray-800 dark:text-dark-100">{l.itemName}</td>
                      <td className="px-3 py-3 font-mono text-xs text-gray-500">{l.hsn}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateCartQty(i, -1)}
                            className="grid size-6 place-items-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-primary hover:text-primary dark:border-dark-500">
                            <MinusIcon className="size-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-gray-800 dark:text-dark-100">{l.qty}</span>
                          <button onClick={() => updateCartQty(i, 1)}
                            className="grid size-6 place-items-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-primary hover:text-primary dark:border-dark-500">
                            <PlusIcon className="size-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-800 dark:text-dark-100">₹{l.price}</td>
                      <td className="px-3 py-3 text-gray-500">{l.unit}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">{l.taxPercent}%</span>
                      </td>
                      <td className="px-3 py-3 text-gray-500">{l.discPercent}%</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-dark-200">₹{l.basic.toFixed(2)}</td>
                      <td className="px-3 py-3 text-gray-500">₹{l.discAmt.toFixed(2)}</td>
                      <td className="px-3 py-3 text-gray-500">₹{l.taxAmt.toFixed(2)}</td>
                      <td className="px-3 py-3 font-bold text-primary-600 dark:text-primary-400">₹{l.net.toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => removeCartLine(i)}
                          className="grid size-7 place-items-center rounded-full text-error transition-colors hover:bg-error/10">
                          <TrashIcon className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-dark-800">
                    <td colSpan={8} className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-dark-300">Total:</td>
                    <td className="px-3 py-3 font-bold text-gray-800 dark:text-dark-100">₹{summary.totalBasic.toFixed(2)}</td>
                    <td className="px-3 py-3 font-bold text-gray-500">₹{summary.totalDiscount.toFixed(2)}</td>
                    <td className="px-3 py-3 font-bold text-gray-500">₹{summary.totalTax.toFixed(2)}</td>
                    <td className="px-3 py-3 font-bold text-primary-600 dark:text-primary-400">
                      ₹{cart.reduce((s, l) => s + l.net, 0).toFixed(2)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {/* ── Additional Charges + Payment Summary ─────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Additional Charges */}
          <Card className="p-5">
            <SectionHeader icon={TruckIcon} title="Additional Charges" color="text-indigo-600 dark:text-indigo-400" />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <FieldLabel>Freight Charge</FieldLabel>
                <Input type="number" value={freight}
                  onChange={e => setFreight(Number(e.target.value))}
                  prefix={<CurrencyRupeeIcon className="size-4" />} />
              </div>
              <div>
                <FieldLabel>Other Expense</FieldLabel>
                <Input type="number" value={otherExpense}
                  onChange={e => setOtherExpense(Number(e.target.value))}
                  prefix={<CurrencyRupeeIcon className="size-4" />} />
              </div>
              <div>
                <FieldLabel>Round Amount</FieldLabel>
                <Input type="number" value={roundAmt}
                  onChange={e => setRoundAmt(Number(e.target.value))}
                  prefix={<CurrencyRupeeIcon className="size-4" />} />
              </div>
            </div>
          </Card>

          {/* Payment Summary */}
          <Card className="p-5">
            <SectionHeader icon={ClipboardDocumentListIcon} title="Payment Summary" color="text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-2">
              {[
                { label: "Total Basic",    val: summary.totalBasic,    muted: false },
                { label: "CGST",           val: summary.cgst,           muted: true },
                { label: "SGST",           val: summary.sgst,           muted: true },
                { label: "Total Tax",      val: summary.totalTax,       muted: false },
                { label: "Total Discount", val: summary.totalDiscount,  muted: true },
                { label: "Freight",        val: summary.freight,        muted: true },
                { label: "Other Expense",  val: summary.otherExpense,   muted: true },
                { label: "Round Off",      val: summary.roundAmt,       muted: true },
              ].map(({ label, val, muted }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className={clsx("text-sm", muted ? "text-gray-400 dark:text-dark-400" : "text-gray-600 dark:text-dark-200")}>
                    {label}
                  </span>
                  <span className={clsx("text-sm font-medium tabular-nums", muted ? "text-gray-500 dark:text-dark-300" : "text-gray-700 dark:text-dark-100")}>
                    ₹ {val.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3 dark:bg-primary/10">
                <span className="text-base font-bold text-gray-800 dark:text-dark-50">Grand Total</span>
                <span className="text-2xl font-black text-primary tabular-nums">₹ {summary.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Bottom Save ───────────────────────────────────────────────────── */}
        {cart.length > 0 && (
          <div className="flex justify-end">
            <Button color="primary" className="h-11 gap-2 px-8 text-base font-bold shadow-lg shadow-primary/30"
              onClick={handleSave} disabled={saving}>
              <ArrowDownOnSquareIcon className="size-5" />
              {saving ? "Saving Sale..." : "Save Sale"}
            </Button>
          </div>
        )}
      </div>

      <ItemSelectorModal open={itemModal} onClose={() => setItemModal(false)} onSelect={handleSelectItem} />
      <CustomerModal open={customerModal} onClose={() => setCustomerModal(false)} onSelect={setCustomer} />
    </Page>
  );
}
