// src/app/pages/stock-verification/index.tsx
import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowPathIcon, CheckCircleIcon, ClockIcon, CubeIcon,
  EyeIcon, FunnelIcon, InboxStackIcon, MagnifyingGlassIcon,
  TruckIcon, XMarkIcon, BuildingStorefrontIcon,
  ClipboardDocumentListIcon, DocumentTextIcon, PhoneIcon,
  MapPinIcon, EnvelopeIcon, CalendarIcon, ReceiptPercentIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Input, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { formatDateDDMMYYYY, Get, Post, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import {
  StockVerificationRow, extractStockVerificationRows,
  STOCK_VERIFY_STATUS_FILTERS, getVerifyStatusStyle,
} from "./data";

const API_ENDPOINT = "pos/stock-transfers/pending-verification/";
const PAGE_SIZE = 15;

// ── Helpers ───────────────────────────────────────────────────────────────
const safeNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "string") {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  }
  if (typeof val === "number") return val;
  return 0;
};

// ── Detail Types (mirror non-theme version) ───────────────────────────────
interface VerifyItem {
  id: number;
  from_item_name: string;
  from_variant_info: string;
  from_barcode: string;
  from_size: string;
  from_color: string;
  quantity: number;
  rate: number;
  is_stock_updated: boolean;
  status: "Verified" | "Pending";
  hsnCode: string;
  taxSlab: string;
  purchase_price: number;
  branch_price: number;
  sales_price: number;
  mrp: number;
  tax_percent?: string;
  basic_amount?: number;
  tax_amount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  net_amount?: number;
  discount_percent?: number | string;
  discount_amount?: number | string;
}

interface TransferDetail {
  transfer_no: string;
  transfer_date: string;
  from_branch: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
  };
  to_branch: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  status: string;
  note: string;
  items: VerifyItem[];
}

// ── Per-item discount helpers ─────────────────────────────────────────────
const getItemGross = (i: VerifyItem): number => safeNumber(i.quantity) * safeNumber(i.rate);
const getItemDiscountPercent = (i: VerifyItem): number => safeNumber(i.discount_percent);
const getItemDiscount = (i: VerifyItem): number => {
  const stored = safeNumber(i.discount_amount);
  if (stored > 0) return stored;
  const pct = getItemDiscountPercent(i);
  return pct > 0 ? (getItemGross(i) * pct) / 100 : 0;
};
const getItemAmount = (i: VerifyItem): number => getItemGross(i) - getItemDiscount(i);

// ══════════════════════════════════════════════════════════════════════════
// TRANSFER DETAIL DRAWER
// ══════════════════════════════════════════════════════════════════════════
function TransferVerificationDrawer({
  isOpen, onClose, transferId, detail, loading,
  websiteDisplay, onWebsiteDisplayChange,
  verifyingItem, verifyingAll,
  onVerifyItem, onVerifyAll,
  onOpenCreditorPopup,
}: {
  isOpen: boolean;
  onClose: () => void;
  transferId: number | null;
  detail: TransferDetail | null;
  loading: boolean;
  websiteDisplay: boolean;
  onWebsiteDisplayChange: (v: boolean) => void;
  verifyingItem: number | null;
  verifyingAll: boolean;
  onVerifyItem: (transferId: number, itemId: number) => void;
  onVerifyAll: (transferId: number) => void;
  onOpenCreditorPopup: () => void;
}) {
  // ✅ Totals — amount, discount aur GST
  const gstTotals = useMemo(() => {
    const items = detail?.items || [];
    const gross = items.reduce((a, b) => a + getItemGross(b), 0);
    const discount = items.reduce((a, b) => a + getItemDiscount(b), 0);
    return {
      gross,
      discount,
      afterDiscount: gross - discount,
      basic: items.reduce((a, b) => a + safeNumber(b.basic_amount), 0),
      tax: items.reduce((a, b) => a + safeNumber(b.tax_amount), 0),
      cgst: items.reduce((a, b) => a + safeNumber(b.cgst), 0),
      sgst: items.reduce((a, b) => a + safeNumber(b.sgst), 0),
      igst: items.reduce((a, b) => a + safeNumber(b.igst), 0),
      net: items.reduce((a, b) => a + safeNumber(b.net_amount), 0),
    };
  }, [detail]);

  const hasGst = (detail?.items || []).some(i => safeNumber(i.basic_amount) > 0);
  const hasDiscount = gstTotals.discount > 0;

  const pendingItems = (detail?.items || []).filter(i => !i.is_stock_updated);
  const verifiedItems = (detail?.items || []).filter(i => i.is_stock_updated);
  const allVerified = !!detail && pendingItems.length === 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={onClose}>
        <TransitionChild
          as="div"
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
        />

        <TransitionChild
          as={DialogPanel}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="translate-x-full" enterTo="translate-x-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-x-0" leaveTo="translate-x-full"
          className="fixed top-0 right-0 flex h-full w-full lg:max-w-[75%] xl:max-w-[68%] transform-gpu flex-col bg-white dark:bg-dark-700"
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="bg-primary flex shrink-0 items-center justify-between border-b border-primary/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-white/20 text-white">
                <ClipboardDocumentListIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {detail?.transfer_no || "Transfer Details"}
                  {detail && (
                    allVerified
                      ? <Badge color="success" variant="soft" className="text-[10px] uppercase">
                          Fully Verified
                        </Badge>
                      : <Badge color="warning" variant="soft" className="text-[10px] uppercase">
                          {pendingItems.length} Pending
                        </Badge>
                  )}
                </h3>
                <p className="mt-0.5 text-sm text-white/75">
                  {detail?.from_branch?.name} → {detail?.to_branch?.name}
                  {detail?.transfer_date && ` · ${formatDateDDMMYYYY(String(detail.transfer_date))}`}
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="flat"
              isIcon
              className="size-8 rounded-full text-white hover:bg-white/10"
            >
              <XMarkIcon className="size-5" />
            </Button>
          </div>

          {/* ── Content ───────────────────────────────────────────── */}
          <div className="hide-scrollbar grow overflow-y-auto px-5 py-5 space-y-4">
            {loading || !detail ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-3 text-sm text-gray-500 dark:text-dark-300">
                  Loading transfer details…
                </p>
              </div>
            ) : (
              <>
                {/* Branch info cards */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* From Branch */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 dark:border-primary/30 dark:bg-primary/10">
                    <div className="mb-3 flex items-center gap-2">
                      <TruckIcon className="size-4 text-primary-600 dark:text-primary-400" />
                      <span className="text-xs font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                        From Branch
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="col-span-2 flex items-center gap-2">
                        <BuildingStorefrontIcon className="size-3.5 text-gray-400" />
                        <span className="font-semibold text-gray-800 dark:text-dark-100">
                          {detail.from_branch?.name || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PhoneIcon className="size-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-dark-200">
                          {detail.from_branch?.phone || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <EnvelopeIcon className="size-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-dark-200 truncate">
                          {detail.from_branch?.email || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="size-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-dark-200">
                          {detail.from_branch?.city || "—"}
                          {detail.from_branch?.state ? `, ${detail.from_branch.state}` : ""}
                        </span>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500 dark:text-dark-300 truncate">
                        {detail.from_branch?.address || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Transfer meta */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-800">
                    <div className="mb-3 flex items-center gap-2">
                      <CalendarIcon className="size-4 text-gray-500 dark:text-dark-300" />
                      <span className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-dark-200">
                        Transfer Info
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-gray-400 dark:text-dark-400">Date</div>
                        <div className="font-semibold text-gray-800 dark:text-dark-100">
                          {formatDateDDMMYYYY(String(detail.transfer_date))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 dark:text-dark-400">Total Items</div>
                        <div className="font-semibold text-gray-800 dark:text-dark-100">
                          {detail.items.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 dark:text-dark-400">Verified</div>
                        <div className="font-semibold text-success-600">
                          {verifiedItems.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 dark:text-dark-400">Pending</div>
                        <div className="font-semibold text-warning-600">
                          {pendingItems.length}
                        </div>
                      </div>
                      {detail.note && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-400 dark:text-dark-400">Note</div>
                          <div className="text-xs text-gray-600 dark:text-dark-200">
                            {detail.note}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Website Display toggle + Verify All */}
                {!allVerified && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-750">
                    <label className="flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => onWebsiteDisplayChange(!websiteDisplay)}
                        className={clsx(
                          "relative h-6 w-11 cursor-pointer rounded-full transition-all",
                          websiteDisplay ? "bg-success-500" : "bg-gray-300 dark:bg-dark-500"
                        )}
                      >
                        <div
                          className="absolute top-0.5 size-5 rounded-full bg-white shadow transition-all"
                          style={{
                            left: websiteDisplay ? "calc(100% - 22px)" : "2px",
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-700 dark:text-dark-100">
                          Website Display
                        </div>
                        <div className="text-xs text-gray-400 dark:text-dark-400">
                          Make items visible on the website after verification
                        </div>
                      </div>
                    </label>

                    <Button
                      color="primary"
                      className="h-9 gap-2 rounded-lg px-5 text-sm"
                      disabled={verifyingAll || pendingItems.length === 0}
                      onClick={() => onVerifyAll(transferId!)}
                    >
                      <CheckCircleIcon className="size-4" />
                      {verifyingAll ? "Verifying…" : `Verify All (${pendingItems.length})`}
                    </Button>
                  </div>
                )}

                {/* Items Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-dark-500">
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-500 dark:bg-dark-800">
                    <CubeIcon className="size-4 text-primary-500" />
                    <span className="font-semibold text-gray-700 dark:text-dark-100 text-sm">
                      Transfer Items
                    </span>
                    <Badge color="info" variant="soft" className="text-xs">
                      {detail.items.length}
                    </Badge>
                    {pendingItems.length > 0 && (
                      <Badge color="warning" variant="soft" className="text-xs">
                        {pendingItems.length} pending
                      </Badge>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <Table hoverable className="w-full min-w-[1100px] text-left">
                      <THead>
                        <Tr>
                          {["#","Item","Variant","Barcode","HSN","GST%","Qty","Rate ₹","Disc %","Amount ₹","Status","Action"].map(h => (
                            <Th
                              key={h}
                              className="bg-primary/10 text-xs font-semibold uppercase text-primary-700 dark:bg-primary/20 dark:text-primary-300 whitespace-nowrap"
                            >
                              {h}
                            </Th>
                          ))}
                        </Tr>
                      </THead>
                      <TBody>
                        {detail.items.map((item, idx) => {
                          const discPct = getItemDiscountPercent(item);
                          const discAmt = getItemDiscount(item);
                          const rowHasDiscount = discAmt > 0;

                          return (
                            <Tr
                              key={item.id}
                              className={clsx(
                                item.is_stock_updated && "bg-success-50/40 dark:bg-success-900/10",
                              )}
                            >
                              <Td className="text-xs text-gray-400 dark:text-dark-500">
                                {idx + 1}
                              </Td>
                              <Td className="font-semibold text-gray-800 dark:text-dark-100">
                                {item.from_item_name}
                              </Td>
                              <Td className="text-center">
                                <Badge color="info" variant="soft" className="text-xs">
                                  {item.from_variant_info || "Default"}
                                </Badge>
                              </Td>
                              <Td className="text-center font-mono text-xs text-gray-500 dark:text-dark-300">
                                {item.from_barcode || "—"}
                              </Td>
                              <Td className="text-center font-mono text-xs text-gray-500 dark:text-dark-300">
                                {item.hsnCode || "—"}
                              </Td>
                              <Td className="text-center">
                                <Badge color="warning" variant="soft" className="text-xs">
                                  {item.taxSlab || "0%"}
                                </Badge>
                              </Td>
                              <Td className="text-center">
                                <Badge color="info" variant="soft" className="text-xs font-bold">
                                  {item.quantity}
                                </Badge>
                              </Td>
                              <Td className="text-right font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
                                ₹{safeNumber(item.branch_price).toFixed(2)}
                              </Td>
                              <Td className="text-center">
                                {rowHasDiscount ? (
                                  <div className="leading-tight">
                                    <span className="inline-block rounded-lg bg-success-50 px-2 py-0.5 text-xs font-bold text-success-700 dark:bg-success-900/30 dark:text-success-400">
                                      {discPct > 0 ? `${Number(discPct.toFixed(2))}%` : "—"}
                                    </span>
                                    <div className="mt-0.5 text-[11px] text-success-600 dark:text-success-400">
                                      − ₹{discAmt.toFixed(2)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-dark-500">—</span>
                                )}
                              </Td>
                              <Td className="text-right font-mono text-xs font-semibold text-gray-800 dark:text-dark-100">
                                {rowHasDiscount && (
                                  <div className="text-[11px] font-normal text-gray-400 line-through">
                                    ₹{getItemGross(item).toFixed(2)}
                                  </div>
                                )}
                                ₹{getItemAmount(item).toFixed(2)}
                              </Td>
                              <Td className="text-center">
                                {item.is_stock_updated ? (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-success-50 px-2 py-1 text-xs font-semibold text-success-700 dark:bg-success-900/30 dark:text-success-400">
                                    <CheckCircleIcon className="size-3" /> Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-warning-50 px-2 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-900/30 dark:text-warning-400">
                                    <ClockIcon className="size-3" /> Pending
                                  </span>
                                )}
                              </Td>
                              <Td className="text-center">
                                {item.is_stock_updated ? (
                                  <span className="text-xs text-gray-400 dark:text-dark-400">
                                    ✓ Done
                                  </span>
                                ) : (
                                  <Button
                                    color="primary"
                                    className="h-7 gap-1.5 rounded-lg px-3 text-xs font-semibold"
                                    disabled={verifyingItem === item.id || verifyingAll}
                                    onClick={() => onVerifyItem(transferId!, item.id)}
                                  >
                                    {verifyingItem === item.id ? (
                                      <>
                                        <div className="size-3 animate-spin rounded-full border border-white border-t-transparent" />
                                        Verifying…
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircleIcon className="size-3.5" /> Verify
                                      </>
                                    )}
                                  </Button>
                                )}
                              </Td>
                            </Tr>
                          );
                        })}
                      </TBody>
                    </Table>
                  </div>

                  {/* Summary Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-500 dark:bg-dark-800">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500 dark:text-dark-300">
                        Total: <b className="text-gray-700 dark:text-dark-100">{detail.items.length}</b>
                      </span>
                      <span className="text-success-600 dark:text-success-400">
                        Verified: <b>{verifiedItems.length}</b>
                      </span>
                      <span className="text-warning-600 dark:text-warning-400">
                        Pending: <b>{pendingItems.length}</b>
                      </span>
                    </div>
                    {allVerified && (
                      <div className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-2 text-sm font-semibold text-success-700 dark:bg-success-900/30 dark:text-success-400">
                        <CheckCircleIcon className="size-4" />
                        Transfer Fully Verified!
                      </div>
                    )}
                  </div>
                </div>

                {/* ✅ GST Summary Card */}
                {(hasGst || hasDiscount) && (
                  <div className="rounded-2xl border border-success-200/60 bg-gradient-to-br from-success-50/60 to-primary-50/40 p-5 dark:border-success-800/40 dark:from-success-900/10 dark:to-primary-900/10">
                    <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-dark-200">
                      <ReceiptPercentIcon className="size-4 text-success-600 dark:text-success-400" />
                      GST Summary
                    </h4>
                    <div className="space-y-1.5 text-sm">
                      {hasDiscount && (
                        <>
                          <div className="flex justify-between border-b border-success-100 py-1.5 dark:border-success-900/30">
                            <span className="text-gray-600 dark:text-dark-300">Total Amount (Rate × Qty)</span>
                            <span className="font-medium tabular-nums">₹{gstTotals.gross.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-success-100 py-1.5 dark:border-success-900/30">
                            <span className="text-success-700 dark:text-success-400">Discount (−)</span>
                            <span className="font-medium tabular-nums text-success-700 dark:text-success-400">
                              − ₹{gstTotals.discount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between border-b-2 border-success-200 py-1.5 font-semibold dark:border-success-800/40">
                            <span className="text-gray-700 dark:text-dark-100">Amount after Discount</span>
                            <span className="tabular-nums">₹{gstTotals.afterDiscount.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between border-b border-success-100 py-1.5 dark:border-success-900/30">
                        <span className="text-gray-600 dark:text-dark-300">Total Basic Amount</span>
                        <span className="font-semibold tabular-nums">₹{gstTotals.basic.toFixed(2)}</span>
                      </div>
                      {(gstTotals.cgst > 0 || gstTotals.sgst > 0) ? (
                        <>
                          <div className="flex justify-between border-b border-success-100 py-1.5 dark:border-success-900/30">
                            <span className="text-gray-600 dark:text-dark-300">CGST</span>
                            <span className="font-medium tabular-nums">₹{gstTotals.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-b border-success-100 py-1.5 dark:border-success-900/30">
                            <span className="text-gray-600 dark:text-dark-300">SGST</span>
                            <span className="font-medium tabular-nums">₹{gstTotals.sgst.toFixed(2)}</span>
                          </div>
                        </>
                      ) : gstTotals.igst > 0 ? (
                        <div className="flex justify-between border-b border-success-100 py-1.5 dark:border-success-900/30">
                          <span className="text-gray-600 dark:text-dark-300">IGST</span>
                          <span className="font-medium tabular-nums">₹{gstTotals.igst.toFixed(2)}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between border-t-2 border-success-200 pt-2 text-base font-bold dark:border-success-800/40">
                        <span className="text-gray-700 dark:text-dark-100">Total Tax Amount</span>
                        <span className="text-success-700 dark:text-success-400 tabular-nums">
                          ₹{gstTotals.tax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-base font-bold">
                        <span className="text-gray-700 dark:text-dark-100">Net Total (incl. Tax)</span>
                        <span className="text-success-700 dark:text-success-400 tabular-nums">
                          ₹{gstTotals.net.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-end border-t border-gray-200 px-5 py-4 dark:border-dark-500">
            <Button variant="outlined" className="px-8" onClick={onClose}>
              Close
            </Button>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

// ── Creditor Popup ────────────────────────────────────────────────────────
function CreditorPopup({
  isOpen, onClose, onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: () => void;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[300]" onClose={onClose}>
        <TransitionChild
          as="div"
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity dark:bg-black/50"
        />
        <TransitionChild
          as={DialogPanel}
          enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
          leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
          className="fixed inset-0 z-[310] m-auto flex h-fit w-[92%] max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-700"
        >
          <div className="flex flex-col items-center px-6 py-5 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
              <ExclamationTriangleIcon className="size-6 text-warning-600 dark:text-warning-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
              Account Required
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-dark-300">
              Before verifying stock, you need to create a <b>Sundry Creditor (Main)</b>{" "}
              account. Click OK to go to the account creation page.
            </p>
          </div>
          <div className="flex gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-500">
            <Button
              variant="outlined"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              className="flex-1"
              onClick={onNavigate}
            >
              OK, Create Account
            </Button>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function StockVerificationPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<StockVerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);

  // ── Drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTransferId, setDrawerTransferId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TransferDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Verify state ──
  const [websiteDisplay, setWebsiteDisplay] = useState(false);
  const [verifyingItem, setVerifyingItem] = useState<number | null>(null);
  const [verifyingAll, setVerifyingAll] = useState(false);

  // ── Creditor popup ──
  const [showCreditorPopup, setShowCreditorPopup] = useState(false);

  const fetchRows = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const res = await Get(API_ENDPOINT, { page: pg }) as any;
      const body = res?.data ?? res;
      const { rows: list, count } = extractStockVerificationRows(body);
      setRows(list);
      setTotal(count || list.length);
      setTotalPages(Math.ceil((count || list.length) / PAGE_SIZE) || 1);
    } catch {
      toasterrormsg("Failed to load stock verifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(page); }, [fetchRows, page]);

  const counters = useMemo(() => ({
    incoming: rows.length,
    pending: rows.filter(r => r.status === "pending").length,
    verified: rows.filter(r => r.status === "verified").length,
    partial: rows.filter(r => r.status === "partial").length,
    itemsPending: rows.reduce((s, r) => s + r.totalPendingQty, 0),
  }), [rows]);

  const branches = useMemo(
    () => Array.from(new Set(rows.map(r => r.fromBranch).filter(Boolean))),
    [rows]
  );

  const filteredRows = useMemo(() => {
    let d = rows;
    if (statusFilter !== "all") d = d.filter(r => r.status === statusFilter);
    if (branchFilter !== "all") d = d.filter(r => r.fromBranch === branchFilter);
    return d;
  }, [rows, statusFilter, branchFilter]);

  // ── Detail loader ──
  const loadTransferDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await Get(`pos/stock-transfers/${id}/items/`) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        setDetail(body as TransferDetail);
      } else {
        toasterrormsg("Could not load transfer details");
      }
    } catch {
      toasterrormsg("Could not load transfer details");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Open drawer for a transfer ──
  const openDrawer = useCallback((id: number) => {
    setDrawerTransferId(id);
    setDrawerOpen(true);
    setWebsiteDisplay(false);
    loadTransferDetail(id);
  }, [loadTransferDetail]);

  // ── Close drawer + reset ──
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDrawerTransferId(null);
    setDetail(null);
    setWebsiteDisplay(false);
  }, []);

  // ── Verify single item ──
  const verifySingleItem = useCallback(async (transferId: number, itemId: number) => {
    setVerifyingItem(itemId);
    try {
      const res = await Post(
        `pos/stock-transfers/${transferId}/verify-item/${itemId}/`,
        { website_display: websiteDisplay }
      ) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        toastsuccessmsg(body.message || "Item verified!");
        await loadTransferDetail(transferId);
        fetchRows(page);
      } else {
        toasterrormsg(body?.message || "Verification failed");
      }
    } catch (e: any) {
      const errCode = e?.response?.data?.error_code;
      if (errCode === "NO_SUNDRY_CREDITOR_ACCOUNT") {
        setShowCreditorPopup(true);
      } else {
        toasterrormsg(e?.response?.data?.message || "Error verifying item");
      }
    } finally {
      setVerifyingItem(null);
    }
  }, [websiteDisplay, loadTransferDetail, fetchRows, page]);

  // ── Verify all ──
  const verifyAllItems = useCallback(async (transferId: number) => {
    if (!confirm("Verify all items?")) return;
    setVerifyingAll(true);
    try {
      const res = await Post(
        `pos/stock-transfers/${transferId}/verify-all/`,
        { website_display: websiteDisplay }
      ) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        toastsuccessmsg(body.message || "All items verified!");
        closeDrawer();
        fetchRows(page);
      } else {
        toasterrormsg(body?.message || "Verification failed");
      }
    } catch (e: any) {
      const errCode = e?.response?.data?.error_code;
      if (errCode === "NO_SUNDRY_CREDITOR_ACCOUNT") {
        setShowCreditorPopup(true);
      } else {
        toasterrormsg(e?.response?.data?.message || "Error verifying items");
      }
    } finally {
      setVerifyingAll(false);
    }
  }, [websiteDisplay, closeDrawer, fetchRows, page]);

  // ── Columns ──
  const columns = useMemo<ColumnDef<StockVerificationRow>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<StockVerificationRow, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(page - 1) * PAGE_SIZE + row.index + 1}
        </span>
      ),
    },
    {
      id: "transferId", accessorKey: "transferId", header: "Transfer No.",
      cell: ({ getValue, table, row }: CellContext<StockVerificationRow, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
            </span>
            <span className="text-[11px] text-gray-400 dark:text-dark-400">
              for {row.original.orderId}
            </span>
          </div>
        );
      },
    },
    {
      id: "fromBranch", accessorKey: "fromBranch", header: "From Branch",
      cell: ({ getValue, table }: CellContext<StockVerificationRow, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-dark-700 dark:text-dark-100">
            <TruckIcon className="size-3.5" />
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "date", accessorKey: "date", header: "Date",
      cell: ({ getValue }: CellContext<StockVerificationRow, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "totalItems", accessorKey: "totalItems", header: "Items",
      cell: ({ getValue }: CellContext<StockVerificationRow, unknown>) => (
        <span className="text-center font-medium tabular-nums text-gray-800 dark:text-dark-100">
          {String(getValue() ?? "0")}
        </span>
      ),
    },
    {
      id: "totalQty", accessorKey: "totalQty", header: "Total Qty",
      cell: ({ getValue }: CellContext<StockVerificationRow, unknown>) => (
        <span className="font-semibold tabular-nums text-gray-800 dark:text-dark-100">
          {String(getValue() ?? "0")}
        </span>
      ),
    },
    {
      id: "totalPendingQty", accessorKey: "totalPendingQty", header: "Pending",
      cell: ({ getValue, row }: CellContext<StockVerificationRow, unknown>) => {
        const v = Number(getValue() ?? 0);
        if (row.original.status === "verified") {
          return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircleIcon className="size-3" /> 0
            </span>
          );
        }
        return v > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <ClockIcon className="size-3" /> {v}
          </span>
        ) : <span className="text-xs text-gray-400">—</span>;
      },
    },
    {
      id: "status", accessorKey: "status", header: "Status",
      cell: ({ getValue }: CellContext<StockVerificationRow, unknown>) => {
        const v = String(getValue() ?? "");
        const s = getVerifyStatusStyle(v);
        return (
          <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize", s.bg)}>
            <span className={clsx("size-1.5 rounded-full", s.dot)} />
            {v}
          </span>
        );
      },
    },
    {
      id: "actions", header: "Action", size: 80, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<StockVerificationRow, unknown>) => (
        <div className="flex justify-center">
          {row.original.status === "verified" ? (
            <Button
              isIcon
              variant="flat"
              className="size-8 rounded-full"
              onClick={() => openDrawer(row.original.id)}
              title="View"
            >
              <EyeIcon className="size-4" />
            </Button>
          ) : (
            <Button
              color="success"
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold"
              onClick={() => openDrawer(row.original.id)}
              title="Verify"
            >
              <CheckCircleIcon className="size-4" /> Verify
            </Button>
          )}
        </div>
      ),
    },
  ], [page, openDrawer]);

  const table = useReactTable({
    data: filteredRows,
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
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  return (
    <Page title="Stock Verification">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Stock Verification
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Showing{" "}
              <span className="font-semibold text-gray-800 dark:text-dark-100">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800 dark:text-dark-100">{total}</span>{" "}
              incoming transfers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={() => setShowFilter(v => !v)}
            >
              <FunnelIcon className={clsx("size-4", showFilter && "text-primary")} />
              <span>Filters</span>
            </Button>
            <Button
              variant="outlined"
              className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={() => fetchRows(page)}
              disabled={loading}
            >
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="px-(--margin-x) mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Incoming",  value: counters.incoming,  bg: "bg-gradient-to-br from-primary-500 to-primary-700",   Icon: InboxStackIcon },
            { label: "Pending",   value: counters.pending,   bg: "bg-gradient-to-br from-amber-500 to-amber-600",        Icon: ClockIcon },
            { label: "Verified",  value: counters.verified,  bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",    Icon: CheckCircleIcon },
            { label: "Partial",   value: counters.partial,   bg: "bg-gradient-to-br from-rose-500 to-rose-700",          Icon: TruckIcon },
          ].map(({ label, value, bg, Icon }) => (
            <div key={label} className={clsx("relative overflow-hidden rounded-xl p-4 text-white shadow-md", bg)}>
              <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
              <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
                <Icon className="size-4 text-white" />
              </div>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="mt-0.5 text-xs font-medium text-white/80">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="px-(--margin-x) mt-4 max-w-sm">
          <Input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
            classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
            placeholder="Search transfer, order, branch..."
          />
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div className="px-(--margin-x) mt-3">
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-600">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STOCK_VERIFY_STATUS_FILTERS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setStatusFilter(f.key)}
                      className={clsx(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        statusFilter === f.key
                          ? "bg-primary text-white"
                          : "border border-gray-300 bg-white text-gray-600 hover:border-primary hover:text-primary dark:border-dark-500 dark:bg-dark-700 dark:text-dark-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              {branches.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">From Branch</p>
                  <div className="flex flex-wrap gap-2">
                    {["all", ...branches].map(b => (
                      <button
                        key={b}
                        onClick={() => setBranchFilter(b)}
                        className={clsx(
                          "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                          branchFilter === b
                            ? "bg-primary text-white"
                            : "border border-gray-300 bg-white text-gray-600 hover:border-primary hover:text-primary dark:border-dark-500 dark:bg-dark-700 dark:text-dark-200"
                        )}
                      >
                        {b === "all" ? "All Branches" : b}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {(statusFilter !== "all" || branchFilter !== "all") && (
                <Button
                  variant="flat"
                  className="h-8 text-xs text-error hover:bg-error/10"
                  onClick={() => { setStatusFilter("all"); setBranchFilter("all"); }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* MasterTable */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={loading ? "Loading incoming transfers..." : "No transfers found."}
        />

        {/* Server pagination */}
        {totalPages > 1 && (
          <div className="px-(--margin-x) mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-dark-300">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button
                variant="outlined"
                className="h-8 px-3 text-xs"
                disabled={page === 1 || loading}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    "size-8 rounded-lg text-xs font-medium transition-colors",
                    p === page
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-dark-200 dark:hover:bg-dark-600"
                  )}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="outlined"
                className="h-8 px-3 text-xs"
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Transfer Detail Drawer ── */}
      <TransferVerificationDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        transferId={drawerTransferId}
        detail={detail}
        loading={detailLoading}
        websiteDisplay={websiteDisplay}
        onWebsiteDisplayChange={setWebsiteDisplay}
        verifyingItem={verifyingItem}
        verifyingAll={verifyingAll}
        onVerifyItem={verifySingleItem}
        onVerifyAll={verifyAllItems}
        onOpenCreditorPopup={() => setShowCreditorPopup(true)}
      />

      {/* ── Creditor Popup ── */}
      <CreditorPopup
        isOpen={showCreditorPopup}
        onClose={() => setShowCreditorPopup(false)}
        onNavigate={() => {
          setShowCreditorPopup(false);
          navigate("/accounts", {
            state: { presetGroup: "Sundry Creditor(Main)" },
          });
        }}
      />
    </Page>
  );
}