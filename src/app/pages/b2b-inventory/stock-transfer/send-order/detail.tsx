import {
  ArrowLeftIcon, CheckCircleIcon, TruckIcon,
  DocumentCheckIcon, XMarkIcon, InformationCircleIcon,
  BuildingOfficeIcon, CubeIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button } from "@/components/ui";
import { Get, Post, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";

// ── Types ──────────────────────────────────────────────────────────────────
interface OrderItemDetail {
  id: number;
  item_name: string;
  variant_info: string;
  barcode: string;
  size: string;
  color: string;
  hsnCode: string;
  taxSlab: string;
  requested_quantity: number;
  available_quantity: number;
  approved_quantity: number;
  is_removed: boolean;
  admin_note: string;
  rate: number;
  branch_price: number;
}

interface OrderDetail {
  id: number;
  order_id: string;
  requesting_branch_name: string;
  source_branch_name: string;
  status: string;
  order_date: string;
  note: string;
  linked_transfer_no: string | null;
  linked_transfer_id: number | null;
  credit_term: string;
  items: OrderItemDetail[];
}

interface TransferItemLite {
  id: number;
  from_item_name: string;
  from_variant_info: string;
  from_barcode: string;
  quantity: number;
  rate: number;
  is_packaged: boolean;
  is_received: boolean;
  basic_amount: number;
  tax_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  net_amount: number;
}

interface TransferDetailLite {
  id: number;
  transfer_no: string;
  from_branch_name: string;
  to_branch_name: string;
  transfer_date: string;
  status: "pending" | "confirmed" | "packaging_start" | "packaging_ready" | "partially_received" | "received" | "cancelled";
  note: string;
  items: TransferItemLite[];
}

// ── Status Helpers ─────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  no_stock: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending (Awaiting Verification)",
  sent: "Verified",
  no_stock: "No Stock Available",
  cancelled: "Cancelled",
};

const TRANSFER_STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  packaging_start: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  packaging_ready: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  partially_received: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const TRANSFER_STATUS_LABEL: Record<string, string> = {
  pending: "Pending Confirmation",
  confirmed: "Confirmed — Awaiting Packaging",
  packaging_start: "Packaging in Progress",
  packaging_ready: "Packed — Ready to Receive",
  partially_received: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
};

// ── GST Summary Card ─────────────────────────────────────────────────────────
interface GstTotals { basic: number; tax: number; cgst: number; sgst: number; igst: number; net: number; }

const GstSummaryCard = ({ totals, title = "GST Summary" }: { totals: GstTotals; title?: string }) => (
  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800/30">
    <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100 mb-4">{title}</h3>
    <div className="space-y-1 text-sm">
      <div className="flex justify-between py-1.5 border-b border-blue-100 dark:border-blue-800/30">
        <span className="text-gray-600 dark:text-dark-400">Total Basic Amount</span>
        <span className="font-medium">₹ {totals.basic.toFixed(2)}</span>
      </div>
      {totals.cgst > 0 || totals.sgst > 0 ? (
        <>
          <div className="flex justify-between py-1.5 border-b border-blue-100 dark:border-blue-800/30">
            <span className="text-gray-600 dark:text-dark-400">CGST</span>
            <span className="font-medium">₹ {totals.cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-blue-100 dark:border-blue-800/30">
            <span className="text-gray-600 dark:text-dark-400">SGST</span>
            <span className="font-medium">₹ {totals.sgst.toFixed(2)}</span>
          </div>
        </>
      ) : totals.igst > 0 ? (
        <div className="flex justify-between py-1.5 border-b border-blue-100 dark:border-blue-800/30">
          <span className="text-gray-600 dark:text-dark-400">IGST</span>
          <span className="font-medium">₹ {totals.igst.toFixed(2)}</span>
        </div>
      ) : null}
      <div className="flex justify-between pt-2 text-base font-bold">
        <span>Total Tax Amount</span>
        <span className="text-blue-700 dark:text-blue-400">₹ {totals.tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between pt-2 text-base font-bold border-t-2 border-blue-300 dark:border-blue-700">
        <span>Net Total (incl. Tax)</span>
        <span className="text-blue-700 dark:text-blue-400">₹ {totals.net.toFixed(2)}</span>
      </div>
    </div>
  </div>
);

// ── Main Detail Page Component ─────────────────────────────────────────────
export default function B2BOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [transfer, setTransfer] = useState<TransferDetailLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [acting, setActing] = useState(false);
  const [receivingItemId, setReceivingItemId] = useState<number | null>(null);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await Get(`pos/b2b-orders/${id}/`) as any;
      const body = res?.data ?? res;
      setOrder(body?.order ?? body);
    } catch { toasterrormsg("Could not load order detail."); }
    finally { setLoading(false); }
  };

  const loadTransfer = async () => {
    if (!order?.linked_transfer_id) return;
    setLoadingTransfer(true);
    try {
      const res = await Get(`pos/b2b-transfers/${order.linked_transfer_id}/`) as any;
      const body = res?.data ?? res;
      setTransfer(body?.data ?? body);
    } catch { toasterrormsg("Could not load transfer detail"); }
    finally { setLoadingTransfer(false); }
  };

  useEffect(() => { loadOrder(); }, [id]);
  useEffect(() => {
    if (order?.status === "sent" && order.linked_transfer_id) loadTransfer();
  }, [order?.linked_transfer_id, order?.status]);

  const cancelOrder = async () => {
    if (!order) return;
    if (!confirm("Cancel this order?")) return;
    try {
      const res = await Post(`pos/b2b-orders/${order.id}/cancel/`, {}) as any;
      const body = res?.data ?? res;
      body?.success !== false
        ? (toastsuccessmsg(body?.message ?? "Order cancelled."), navigate("/b2b-inventory/stock-transfer/send-order"))
        : toasterrormsg(body?.message ?? "Failed to cancel order.");
    } catch (e: any) { toasterrormsg(e?.response?.data?.message ?? "Error cancelling order."); }
  };

  const doTransferAction = async (action: "confirm" | "receive" | "cancel") => {
    if (!order?.linked_transfer_id) return;
    if (action !== "cancel") {
      // Location check would go here if needed
    } else if (!confirm("Cancel this transfer?")) return;

    setActing(true);
    try {
      const res = await Post(`pos/b2b-transfers/${order.linked_transfer_id}/${action}/`, {}) as any;
      const body = res?.data ?? res;
      body?.success !== false
        ? (toastsuccessmsg(body?.message ?? "Action completed."), loadTransfer())
        : toasterrormsg(body?.message ?? "Action failed.");
    } catch (e: any) { toasterrormsg(e?.response?.data?.message ?? "Error performing action."); }
    finally { setActing(false); }
  };

  const receiveOneItem = async (itemId: number, itemName: string) => {
    if (!order?.linked_transfer_id) return;
    // Location check would go here if needed

    setReceivingItemId(itemId);
    try {
      const res = await Post(`pos/b2b-transfers/${order.linked_transfer_id}/items/${itemId}/receive/`, {}) as any;
      const body = res?.data ?? res;
      body?.success !== false
        ? (toastsuccessmsg(`${itemName} received`), loadTransfer())
        : toasterrormsg(body?.message ?? "Could not receive item.");
    } catch (e: any) { toasterrormsg(e?.response?.data?.message ?? "Error receiving item."); }
    finally { setReceivingItemId(null); }
  };

  // ── Derived State ─────────────────────────────────────────────────────────
  const isPending = order?.status === "pending";
  const totalRequestedQty = order?.items?.reduce((s, i) => s + i.requested_quantity, 0) || 0;

  const gst = transfer ? transfer.items.reduce((acc, i) => ({
    basic: acc.basic + (i.basic_amount || 0),
    tax: acc.tax + (i.tax_amount || 0),
    cgst: acc.cgst + (i.cgst || 0),
    sgst: acc.sgst + (i.sgst || 0),
    igst: acc.igst + (i.igst || 0),
    net: acc.net + (i.net_amount || 0),
  }), { basic: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, net: 0 }) : { basic: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, net: 0 };

  const canReceive = !!transfer && ["packaging_ready", "partially_received"].includes(transfer.status);
  const remainingCount = transfer ? transfer.items.filter(i => !i.is_received).length : 0;

  if (loading) {
    return (
      <Page title="Order Detail">
        <div className="transition-content w-full pb-8">
          <div className="px-(--margin-x)">
            <div className="flex items-center justify-center py-16">
              <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </div>
        </div>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page title="Order Detail">
        <div className="transition-content w-full pb-8">
          <div className="px-(--margin-x)">
            <div className="text-center py-16 text-gray-400 dark:text-dark-400">
              Order not found
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Order Detail">
      <div className="transition-content w-full pb-8">
        <div className="px-(--margin-x) space-y-4">
          {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outlined" className="h-8 gap-2 rounded-md px-3 text-sm" onClick={() => navigate("/b2b-inventory/stock-transfer/send-order")}>
              <ArrowLeftIcon className="size-4" /> Back to Orders
            </Button>
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">{order.order_id}</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">Order Detail</p>
            </div>
          </div>
          <Badge className={clsx("text-xs font-semibold", STATUS_STYLE[order.status] || "bg-gray-100")}>
            {STATUS_LABEL[order.status] || order.status}
          </Badge>
        </div>

        {/* Order Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-750">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gray-50 rounded-xl p-3 dark:bg-dark-800">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">To Branch</div>
              <div className="font-semibold text-sm text-gray-800 dark:text-dark-100">{order.source_branch_name}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 dark:bg-dark-800">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Term</div>
              <div className="font-semibold text-sm text-gray-800 dark:text-dark-100">Credit</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 dark:bg-dark-800">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order Date</div>
              <div className="font-semibold text-sm text-gray-800 dark:text-dark-100">{order.order_date}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 dark:bg-dark-800">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Requested Qty</div>
              <div className="font-semibold text-sm text-gray-800 dark:text-dark-100">{totalRequestedQty}</div>
            </div>
          </div>
          {order.note && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30">
              <span className="text-xs text-amber-700 dark:text-amber-400">📝 {order.note}</span>
            </div>
          )}
        </div>

        {/* Pending State */}
        {isPending && (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750">
              <table className="w-full text-sm">
                <thead className="bg-primary">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-white">Item</th>
                    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-white">Variant</th>
                    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-white">Barcode</th>
                    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-white">Requested Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={item.id} className={clsx("border-t border-gray-100 dark:border-dark-600", idx % 2 === 0 ? "bg-white dark:bg-dark-750" : "bg-gray-50/30 dark:bg-dark-700/30")}>
                      <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-dark-100">{item.item_name}</td>
                      <td className="px-4 py-2.5">
                        <Badge color="info" variant="soft" className="text-xs">{item.variant_info || "Default"}</Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-dark-300">{item.barcode || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge color="success" variant="soft" className="text-xs font-semibold">{item.requested_quantity}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-blue-700 dark:border-blue-800/30 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-between gap-2 text-sm flex-wrap">
              <span className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Waiting for {order.source_branch_name} to verify stock & send.
              </span>
              <Button variant="outlined" className="h-7 gap-1.5 rounded-md px-3 text-xs border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800/30 dark:text-red-400 dark:hover:bg-red-900/20" onClick={cancelOrder}>
                <XMarkIcon className="size-3.5" /> Cancel Order
              </Button>
            </div>
          </>
        )}

        {/* No Stock State */}
        {order.status === "no_stock" && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3.5 text-orange-700 dark:border-orange-800/30 dark:bg-orange-900/20 dark:text-orange-400 text-sm">
            ⚠️ No stock was available for any item in this order. Please place a new order later.
          </div>
        )}

        {/* Cancelled State */}
        {order.status === "cancelled" && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-600 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400 text-sm">
            This order was cancelled.
          </div>
        )}

        {/* Sent/Verified State */}
        {order.status === "sent" && (
          <>
            {loadingTransfer && !transfer ? (
              <div className="py-12 text-center text-gray-400 dark:text-dark-400">
                <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                Loading transfer...
              </div>
            ) : transfer ? (
              <>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-dark-500 dark:bg-dark-750">
                  <div className="flex items-center gap-3 flex-wrap">
                    <TruckIcon className="size-5 text-primary" />
                    <span className="font-semibold text-gray-700 dark:text-dark-200">Transfer {transfer.transfer_no}</span>
                    <Badge className={clsx("text-xs font-semibold", TRANSFER_STATUS_STYLE[transfer.status])}>
                      {TRANSFER_STATUS_LABEL[transfer.status]}
                    </Badge>
                    {canReceive && (
                      <span className="text-xs text-gray-500 dark:text-dark-400">
                        {remainingCount} of {transfer.items.length} item(s) still to receive
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-dark-800">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">Item</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">Variant</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">Barcode</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">Qty Coming</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">Rate (₹)</th>
                        <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">Amount (₹)</th>
                        {canReceive && <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-600 dark:text-dark-200">Receive</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-dark-600">
                      {transfer.items.map((item, idx) => (
                        <tr key={item.id} className={clsx(idx % 2 === 0 ? "bg-white dark:bg-dark-750" : "bg-gray-50/30 dark:bg-dark-700/30")}>
                          <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-dark-100">{item.from_item_name}</td>
                          <td className="px-4 py-2.5">
                            <Badge color="info" variant="soft" className="text-xs">{item.from_variant_info || "Default"}</Badge>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-dark-300">{item.from_barcode || "—"}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-dark-200">{item.quantity}</td>
                          <td className="px-4 py-2.5 font-mono text-gray-700 dark:text-dark-200">₹{item.rate}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-dark-200">₹{(item.quantity * item.rate).toFixed(2)}</td>
                          {canReceive && (
                            <td className="px-4 py-2.5">
                              {item.is_received ? (
                                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1 dark:text-emerald-400">
                                  <CheckCircleIcon className="size-3.5" /> Received
                                </span>
                              ) : (
                                <Button color="success" className="h-7 gap-1.5 rounded-md px-3 text-xs" disabled={receivingItemId === item.id} onClick={() => receiveOneItem(item.id, item.from_item_name)}>
                                  <DocumentCheckIcon className="size-3.5" /> {receivingItemId === item.id ? "Receiving..." : "Receive"}
                                </Button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {gst.basic > 0 && <GstSummaryCard totals={gst} />}

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-800 flex items-center gap-3 justify-end flex-wrap">
                  {["pending", "confirmed", "packaging_start"].includes(transfer.status) && (
                    <Button variant="outlined" className="h-9 gap-1.5 rounded-md px-4 text-sm border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800/30 dark:text-red-400 dark:hover:bg-red-900/20" disabled={acting} onClick={() => doTransferAction("cancel")}>
                      <XMarkIcon className="size-4" /> Cancel Transfer
                    </Button>
                  )}
                  {transfer.status === "pending" && (
                    <Button color="primary" className="h-9 gap-2 rounded-md px-5 text-sm font-semibold" disabled={acting} onClick={() => doTransferAction("confirm")}>
                      {acting ? (
                        <><span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Confirming...</>
                      ) : (
                        <><CheckCircleIcon className="size-4" /> Confirm Transfer</>
                      )}
                    </Button>
                  )}
                  {transfer.status === "confirmed" && (
                    <span className="text-sm text-gray-500 dark:text-dark-400 flex items-center gap-2">
                      <div className="size-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                      Waiting for {order.source_branch_name} to start packaging.
                    </span>
                  )}
                  {transfer.status === "packaging_start" && (
                    <span className="text-sm text-violet-600 font-medium dark:text-violet-400 flex items-center gap-2">
                      <CubeIcon className="size-4" /> {order.source_branch_name} is packaging your items...
                    </span>
                  )}
                  {canReceive && (
                    <Button color="success" className="h-9 gap-2 rounded-md px-5 text-sm font-semibold" disabled={acting || remainingCount === 0} onClick={() => doTransferAction("receive")}>
                      {acting ? (
                        <><span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Receiving...</>
                      ) : (
                        <><DocumentCheckIcon className="size-4" /> Receive All Remaining ({remainingCount})</>
                      )}
                    </Button>
                  )}
                  {transfer.status === "received" && (
                    <span className="text-sm text-emerald-600 font-semibold dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircleIcon className="size-4" /> Stock received — your inventory has been updated.
                    </span>
                  )}
                  {transfer.status === "cancelled" && (
                    <span className="text-sm text-red-500 font-semibold dark:text-red-400">This transfer was cancelled.</span>
                  )}
                </div>
              </>
            ) : (
              <div className="p-5 text-sm text-gray-400 dark:text-dark-400">No transfer found for this order.</div>
            )}
          </>
        )}
        </div>
      </div>
    </Page>
  );
}
