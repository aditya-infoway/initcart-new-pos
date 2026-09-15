import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { usePermission } from "@/hooks/usePermissions";
import clsx from "clsx";
import {
  ArrowLeftIcon, ArrowDownTrayIcon, PrinterIcon, MapPinIcon,
  UserIcon, PhoneIcon, EnvelopeIcon, TruckIcon, TagIcon,
  CubeIcon, ArrowPathIcon,
} from "@heroicons/react/24/outline";

import { Page } from "@/components/shared/Page";
import { Button, Input } from "@/components/ui";
import { Get, Post, toastsuccessmsg, toasterrormsg, formatDateDDMMYYYY } from "@/ApiHelper";
import {
  OrderDetail, DeliveryInfo, ORDER_STATUS_OPTIONS,
  formatINR, getStatusBadge,
} from "./data";

const DEFAULT_DELIVERY: Partial<DeliveryInfo> = {
  delivery_service: "self",
  delivery_man_name: "",
  delivery_man_phone: "",
  delivery_incentive: 0,
  expected_delivery_date: "",
  tracking_id: "",
  courier_name: "",
  courier_website: "",
  delivery_status: "pending",
};

const cardCls =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-500 dark:bg-dark-700 md:p-6";

export default function OrderDetailPage() {
  const [searchParams] = useSearchParams();
  const branchId = searchParams.get("branch_id");
  const { canEdit } = usePermission("/Orders"); // Update Status / Delivery form gate karne ke liye
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const withBranch = (url: string) => branchId ? `${url}${url.includes("?") ? "&" : "?"}branch_id=${branchId}` : url;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [deliveryInfo, setDeliveryInfo] =
    useState<Partial<DeliveryInfo>>(DEFAULT_DELIVERY);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await Get(withBranch(`pos/branch/orders/${orderId}/`)) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        setOrder(body.data);
        setSelectedStatus(
          body.data?.items?.[0]?.item_status || body.data?.order_status || "pending"
        );
      }
    } catch {
      toasterrormsg("Failed to fetch order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId, branchId]);

  const fetchDelivery = useCallback(async () => {
    try {
      const res = await Get(withBranch(`pos/branch/orders/${orderId}/delivery/`)) as any;
      const body = res?.data ?? res;
      if (body?.success && body?.data) setDeliveryInfo(body.data);
    } catch {
      setDeliveryInfo(DEFAULT_DELIVERY);
    }
  }, [orderId, branchId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      fetchDelivery();
    }
  }, [orderId, fetchOrder, fetchDelivery]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const res = await Post(withBranch('pos/branch/orders/status/update/'), {
        order_id: orderId,
        item_status: selectedStatus,
      }) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        toastsuccessmsg(body.message ?? "Order status updated.");
        fetchOrder();
      }
    } catch (err: any) {
      toasterrormsg(err?.response?.data?.message ?? "Failed to update order status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliverySave = async () => {
    setSavingDelivery(true);
    try {
      const res = await Post(withBranch(`pos/branch/orders/${orderId}/delivery/`), deliveryInfo) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        toastsuccessmsg("Delivery information updated.");
        setDeliveryInfo(body.data);
      }
    } catch (err: any) {
      toasterrormsg(err?.response?.data?.message ?? "Failed to update delivery information.");
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const res = await Get(withBranch(`pos/branch/orders/${orderId}/invoice/`)) as any;
      const data = (res?.data ?? res)?.data;
      const invoiceWindow = window.open("", "_blank");
      if (!invoiceWindow) {
        toasterrormsg("Please allow popups to download invoice.");
        return;
      }
      const rows = (data.items ?? []).map((item: any) => `
        <tr>
          <td>${item.product_name}${item.color ? ` (${item.color})` : ""}${item.size ? ` - ${item.size}` : ""}</td>
          <td>${item.sku}</td>
          <td>${item.quantity}</td>
          <td>${Number(item.tax_percentage || 0)}%</td>
          <td>₹${Number(item.unit_price).toFixed(2)}</td>
          <td>₹${Number(item.total).toFixed(2)}</td>
        </tr>`).join("");

      invoiceWindow.document.write(`
        <html><head><title>Invoice - ${data.order_number}</title>
        <style>
          body{font-family:Arial,sans-serif;padding:30px;color:#333;font-size:14px}
          h1,h2,h3{margin:0}
          .header{display:flex;justify-content:space-between;margin-bottom:25px}
          .company-details{text-align:right}
          .address-row{display:flex;justify-content:space-between;gap:40px;margin-bottom:25px}
          .address-box{width:48%;background:#f9f9f9;padding:15px;border-radius:6px;border:1px solid #e5e5e5}
          .address-box h3{margin-bottom:10px;border-bottom:1px solid #ddd;padding-bottom:5px}
          table{width:100%;border-collapse:collapse;margin-top:15px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#f4f4f4}
          .totals{width:350px;margin-top:20px;margin-left:auto}
          .totals div{display:flex;justify-content:space-between;padding:6px 0}
          .grand-total{font-weight:bold;font-size:16px;border-top:2px solid #000;padding-top:8px}
          .footer{margin-top:40px;text-align:center;font-size:12px;color:#666}
        </style></head><body>
        <div class="header">
          <div>
            <h1>INVOICE</h1>
            <p><strong>Order #:</strong> ${data.order_number}</p>
            <p><strong>Date:</strong> ${new Date(data.order_date).toLocaleDateString()}</p>
          </div>
          <div class="company-details">
            <h2>${data.store_name || "InitCart"}</h2>
            <p>Branch Store</p>
            <p>Email: support@initcart.in</p>
          </div>
        </div>
        <div class="address-row">
          <div class="address-box">
            <h3>Billing Address</h3>
            <p><strong>${data.customer_name}</strong></p>
            <p>${data.billing_address?.address || data.shipping_address.address}</p>
            <p>${data.billing_address?.city || data.shipping_address.city}, ${data.billing_address?.state || data.shipping_address.state} - ${data.billing_address?.pincode || data.shipping_address.pincode}</p>
            <p>Phone: ${data.customer_phone}</p>
            <p>Email: ${data.customer_email}</p>
          </div>
          <div class="address-box">
            <h3>Shipping Address</h3>
            <p><strong>${data.shipping_address.name || data.customer_name}</strong></p>
            <p>${data.shipping_address.address}</p>
            <p>${data.shipping_address.city}, ${data.shipping_address.state} - ${data.shipping_address.pincode}</p>
            <p>Phone: ${data.shipping_address.phone || data.customer_phone}</p>
          </div>
        </div>
        <h3>Order Items</h3>
        <table><thead><tr>
          <th>Item</th><th>SKU</th><th>Qty</th><th>Tax</th><th>Unit Price</th><th>Total</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <div class="totals">
          <div><span>Subtotal:</span><span>₹${Number(data.subtotal).toFixed(2)}</span></div>
          ${data.discount > 0 ? `<div><span>Discount:</span><span>-₹${Number(data.discount).toFixed(2)}</span></div>` : ""}
          ${data.tax > 0 ? `<div><span>Tax:</span><span>₹${Number(data.tax).toFixed(2)}</span></div>` : ""}
          <div class="grand-total"><span>Total:</span><span>₹${Number(data.total).toFixed(2)}</span></div>
        </div>
        <div class="footer"><p>This is a computer generated invoice.</p><p>Thank you for shopping with us!</p></div>
        </body></html>`);
      invoiceWindow.document.close();
      invoiceWindow.print();
    } catch {
      toasterrormsg("Failed to load invoice.");
    }
  };

  const getProductImage = (item: OrderDetail["items"][number]) => {
    const BASE_URL = "https://api.initcart.com";
    let img =
      item.product_details.variant_image ||
      item.product_details.main_image ||
      item.product_details.thumbnail;
    if (!img) return null;
    if (!img.startsWith("http")) img = BASE_URL + img;
    return img;
  };

  if (loading) {
    return (
      <Page title="Branch Order Details">
        <div className="flex h-64 items-center justify-center">
          <ArrowPathIcon className="size-8 animate-spin text-primary-500" />
        </div>
      </Page>
    );
  }

  if (!order) {
    return (
      <Page title="Branch Order Details">
        <div className="px-(--margin-x) py-4">
          <Button variant="flat" className="mb-4 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="size-4" /> Back to Orders
          </Button>
          <div className={clsx(cardCls, "text-center text-gray-500 dark:text-dark-300")}>
            Order not found
          </div>
        </div>
      </Page>
    );
  }

  const summary = order.order_summary;
  const badge = getStatusBadge(order.order_status);

  return (
    <Page title={`Order #${order.order_number}`}>
      <div className="transition-content w-full pb-8">
        <div className="px-(--margin-x) pt-4">
          <Button variant="flat" className="mb-4 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="size-4" /> Back to Orders
          </Button>

          {/* Header */}
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Branch Order Details
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-700 dark:text-dark-100">
                  Order #{order.order_number}
                </span>
                <span className={clsx(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  badge.bg, badge.color,
                )}>
                  {order.order_status?.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                {formatDateDDMMYYYY(order.created_at)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button className="gap-2" onClick={handleDownloadInvoice}>
                <ArrowDownTrayIcon className="size-4" /> Invoice
              </Button>
              <Button variant="outlined" className="gap-2" onClick={() => window.print()}>
                <PrinterIcon className="size-4" /> Print
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Items */}
              <div className={cardCls}>
                <h3 className="mb-4 flex items-center text-base font-semibold text-gray-700 dark:text-dark-100">
                  <CubeIcon className="mr-2 size-5 text-primary-500" /> Order Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-500">
                    <thead className="bg-gray-50 dark:bg-dark-800">
                      <tr>
                        {["SL", "Item Details", "Qty", "Item Price", "Discount", "Total"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-300">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-dark-500">
                      {order.items.map((item, index) => {
                        const img = getProductImage(item);
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm text-gray-800 dark:text-dark-100">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                {img ? (
                                  <img src={img} alt={item.product_name} className="mr-3 size-12 rounded object-cover" />
                                ) : (
                                  <div className="mr-3 flex size-12 items-center justify-center rounded bg-gray-100 dark:bg-dark-600">
                                    <CubeIcon className="size-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-800 dark:text-dark-100">{item.product_name}</div>
                                  <div className="text-xs text-gray-500 dark:text-dark-300">SKU: {item.sku}</div>
                                  {item.color && <div className="text-xs text-gray-500 dark:text-dark-300">Color: {item.color}</div>}
                                  {item.size && <div className="text-xs text-gray-500 dark:text-dark-300">Size: {item.size}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800 dark:text-dark-100">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 dark:text-dark-100">{formatINR(item.unit_price)}</td>
                            <td className="px-4 py-3 text-sm text-gray-800 dark:text-dark-100">{formatINR(item.discount_amount)}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-dark-100">{formatINR(item.total_price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mt-6 border-t border-gray-200 pt-4 dark:border-dark-500">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-gray-600 dark:text-dark-300">Subtotal</span>
                    <span className="font-semibold text-gray-800 dark:text-dark-100">{formatINR(summary?.vendor_subtotal)}</span>
                  </div>
                  {!!summary?.vendor_discount && summary.vendor_discount > 0 && (
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-gray-600 dark:text-dark-300">Discount</span>
                      <span className="font-semibold text-red-600">-{formatINR(summary.vendor_discount)}</span>
                    </div>
                  )}
                  {!!summary?.vendor_tax && summary.vendor_tax > 0 && (
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-gray-600 dark:text-dark-300">Tax ({order.tax_percentage}%)</span>
                      <span className="font-semibold text-gray-800 dark:text-dark-100">{formatINR(summary.vendor_tax)}</span>
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-lg font-bold dark:border-dark-500">
                    <span className="text-gray-800 dark:text-dark-100">Total</span>
                    <span className="text-primary-600 dark:text-primary-400">{formatINR(summary?.vendor_total)}</span>
                  </div>
                </div>
              </div>

              {/* Status & Payment */}
              <div className={cardCls}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-4 flex items-center text-base font-semibold text-gray-700 dark:text-dark-100">
                      <TagIcon className="mr-2 size-5 text-primary-500" /> Status &amp; Payment
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-dark-300">Payment Method:</span>
                        <span className="font-medium capitalize text-gray-800 dark:text-dark-100">{order.payment_method}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-dark-300">Payment Status:</span>
                        <span className={clsx(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          order.payment_status === "completed" || order.payment_status === "paid"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                        )}>
                          {order.payment_status}
                        </span>
                      </div>
                      {order.notes && (
                        <div>
                          <span className="mb-1 block text-gray-600 dark:text-dark-300">Notes:</span>
                          <p className="rounded bg-gray-50 p-2 text-sm dark:bg-dark-800">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div>
                      <h3 className="mb-4 text-base font-semibold text-gray-700 dark:text-dark-100">
                        Update Order Status
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-dark-200">
                            Order Status
                          </label>
                          <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                            disabled={updating}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-3 ring-primary-500/50 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
                          >
                            {ORDER_STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <Button
                          className="w-full gap-2"
                          onClick={handleStatusUpdate}
                          disabled={updating}
                        >
                          {updating ? (
                            <><ArrowPathIcon className="size-4 animate-spin" /> Updating...</>
                          ) : "Update Status"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery */}
              {canEdit && (
                <div className={cardCls}>
                  <h3 className="mb-4 flex items-center text-base font-semibold text-gray-700 dark:text-dark-100">
                    <TruckIcon className="mr-2 size-5 text-primary-500" /> Delivery Information
                  </h3>

                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-dark-200">
                      Delivery Service
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(["self", "courier"] as const).map(svc => (
                        <button
                          key={svc}
                          onClick={() => setDeliveryInfo(prev => ({ ...prev, delivery_service: svc }))}
                          className={clsx(
                            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                            deliveryInfo.delivery_service === svc
                              ? "bg-primary-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-dark-600 dark:text-dark-200 dark:hover:bg-dark-500",
                          )}
                        >
                          {svc === "self" ? "Self Delivery" : "Courier Service"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {deliveryInfo.delivery_service === "courier" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label="Courier Name"
                          value={deliveryInfo.courier_name || ""}
                          onChange={e => setDeliveryInfo({ ...deliveryInfo, courier_name: e.target.value })}
                          placeholder="Enter courier name"
                        />
                        <Input
                          label="Tracking ID"
                          value={deliveryInfo.tracking_id || ""}
                          onChange={e => setDeliveryInfo({ ...deliveryInfo, tracking_id: e.target.value })}
                          placeholder="Enter tracking ID"
                        />
                      </div>
                      <Input
                        type="date"
                        label="Expected Delivery Date"
                        value={deliveryInfo.expected_delivery_date || ""}
                        onChange={e => setDeliveryInfo({ ...deliveryInfo, expected_delivery_date: e.target.value })}
                      />
                      <Button className="w-full" onClick={handleDeliverySave} disabled={savingDelivery}>
                        {savingDelivery ? "Updating..." : "Update Delivery Information"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label="Delivery Man Name"
                          value={deliveryInfo.delivery_man_name || ""}
                          onChange={e => setDeliveryInfo({ ...deliveryInfo, delivery_man_name: e.target.value })}
                          placeholder="Enter delivery man name"
                        />
                        <Input
                          label="Delivery Man Phone"
                          type="tel"
                          value={deliveryInfo.delivery_man_phone || ""}
                          onChange={e => setDeliveryInfo({ ...deliveryInfo, delivery_man_phone: e.target.value })}
                          placeholder="Enter phone number"
                        />
                      </div>
                      <Input
                        type="date"
                        label="Expected Delivery Date"
                        value={deliveryInfo.expected_delivery_date || ""}
                        onChange={e => setDeliveryInfo({ ...deliveryInfo, expected_delivery_date: e.target.value })}
                      />
                      <Button className="w-full" onClick={handleDeliverySave} disabled={savingDelivery}>
                        {savingDelivery ? "Updating..." : "Update Delivery Information"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <div className={cardCls}>
                <h3 className="mb-4 flex items-center text-base font-semibold text-gray-700 dark:text-dark-100">
                  <MapPinIcon className="mr-2 size-5 text-primary-500" /> Shipping Address
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-dark-300">
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Name:</span> {order.customer_details.shipping_address.name}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Phone:</span> {order.customer_details.shipping_address.phone}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Address:</span> {order.customer_details.shipping_address.address}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">City:</span> {order.customer_details.shipping_address.city}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">State:</span> {order.customer_details.shipping_address.state}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Pincode:</span> {order.customer_details.shipping_address.pincode}</p>
                </div>
              </div>

              <div className={cardCls}>
                <h3 className="mb-4 text-base font-semibold text-gray-700 dark:text-dark-100">Billing Address</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-dark-300">
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Name:</span> {order.customer_details.name}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Phone:</span> {order.customer_details.phone}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Email:</span> {order.customer_details.email}</p>
                  <p><span className="font-medium text-gray-700 dark:text-dark-200">Address:</span> {order.customer_details.shipping_address.address}</p>
                </div>
              </div>

              <div className={cardCls}>
                <h3 className="mb-4 flex items-center text-base font-semibold text-gray-700 dark:text-dark-100">
                  <UserIcon className="mr-2 size-5 text-primary-500" /> Customer Information
                </h3>
                <h4 className="mb-2 text-base font-bold text-gray-800 dark:text-dark-100">{order.customer_details.name}</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-dark-300">
                  <p className="flex items-center"><PhoneIcon className="mr-2 size-4 text-gray-400" /> {order.customer_details.phone}</p>
                  <p className="flex items-center"><EnvelopeIcon className="mr-2 size-4 text-gray-400" /> {order.customer_details.email}</p>
                </div>
              </div>

              {deliveryInfo.delivery_status && (
                <div className={cardCls}>
                  <h3 className="mb-4 flex items-center text-base font-semibold text-gray-700 dark:text-dark-100">
                    <TruckIcon className="mr-2 size-5 text-primary-500" /> Delivery Status
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-dark-300">Status:</span>
                      <span className={clsx(
                        "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                        getStatusBadge(deliveryInfo.delivery_status).bg,
                        getStatusBadge(deliveryInfo.delivery_status).color,
                      )}>
                        {deliveryInfo.delivery_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {deliveryInfo.expected_delivery_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-300">Expected Delivery:</span>
                        <span className="font-medium text-gray-800 dark:text-dark-100">
                          {formatDateDDMMYYYY(deliveryInfo.expected_delivery_date)}
                        </span>
                      </div>
                    )}
                    {deliveryInfo.tracking_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-300">Tracking ID:</span>
                        <span className="font-mono text-gray-800 dark:text-dark-100">{deliveryInfo.tracking_id}</span>
                      </div>
                    )}
                    {deliveryInfo.courier_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-dark-300">Courier:</span>
                        <span className="font-medium text-gray-800 dark:text-dark-100">{deliveryInfo.courier_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}