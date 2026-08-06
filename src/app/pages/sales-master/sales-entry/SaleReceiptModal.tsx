import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import { PrinterIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";

import { Button } from "@/components/ui";
import { Get } from "@/ApiHelper";

interface Props {
  saleId: number | null;
  open: boolean;
  onClose: () => void;
}

export function SaleReceiptModal({ saleId, open, onClose }: Props) {
  const [saleData, setSaleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !saleId) return;
    setLoading(true);
    Get(`pos/sale-receipt/${saleId}`)
      .then((res: any) => setSaleData(res?.data ?? res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, saleId]);

  const handlePrint = () => {
    const printContents = document.getElementById("sale-receipt-print")?.innerHTML;
    if (!printContents) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; display: flex; justify-content: center; font-family: Arial, sans-serif; }
        .receipt-container { width: 80mm; padding: 6px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 2px; font-size: 11px; }
        hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
      </style>
      </head><body><div class="receipt-container">${printContents}</div></body></html>
    `);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 500);
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[220]" onClose={onClose}>
        <TransitionChild as="div"
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild as={DialogPanel}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-700"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-600">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-100">Sales Receipt</h2>
                <button onClick={onClose} className="grid size-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600">
                  <XMarkIcon className="size-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-5">
                {loading ? (
                  <div className="py-12 text-center text-sm text-gray-400">Loading receipt...</div>
                ) : saleData ? (
                  <div id="sale-receipt-print">
                    <div className="mb-4 text-center">
                      <h2 className="text-xl font-bold">{saleData.branch_name ?? "Branch Name"}</h2>
                      <p className="text-sm text-gray-500">{saleData.address ?? ""}</p>
                      <hr className="my-3 border-dashed border-gray-300" />
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><strong>Bill No:</strong> {saleData.bill_no ?? "—"} &nbsp; <strong>Date:</strong> {saleData.date ?? "—"}</p>
                      <p><strong>Customer:</strong> {saleData.customer_name ?? "—"} &nbsp; <strong>Time:</strong> {saleData.time ?? "—"}</p>
                      <p><strong>Mobile:</strong> {saleData.mobile ?? "—"}</p>
                      <p><strong>Payment Mode:</strong> {saleData.payment_mode ?? "—"}</p>
                    </div>
                    <hr className="my-3 border-dashed border-gray-300" />
                    <table className="w-full border-collapse border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left">#</th>
                          <th className="border p-2 text-left">Item</th>
                          <th className="border p-2 text-right">Qty</th>
                          <th className="border p-2 text-right">Price</th>
                          <th className="border p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleData.items?.map((v: any, i: number) => (
                          <tr key={i}>
                            <td className="border p-2">{i + 1}</td>
                            <td className="border p-2">{v.name}</td>
                            <td className="border p-2 text-right">{v.qty}</td>
                            <td className="border p-2 text-right">₹{Number(v.price ?? 0).toFixed(2)}</td>
                            <td className="border p-2 text-right">₹{Number(v.amount ?? 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <hr className="my-3 border-dashed border-gray-300" />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>Taxable Amount</span><span>₹{Number(saleData.total_basic ?? 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Discount</span><span>-₹{Number(saleData.total_discount ?? 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Tax (GST)</span><span>₹{Number(saleData.tax_amount ?? 0).toFixed(2)}</span></div>
                      {(saleData.freight ?? 0) > 0 && (
                        <div className="flex justify-between"><span>Freight</span><span>₹{Number(saleData.freight).toFixed(2)}</span></div>
                      )}
                      {(saleData.other_expense ?? 0) > 0 && (
                        <div className="flex justify-between"><span>Other Expense</span><span>₹{Number(saleData.other_expense).toFixed(2)}</span></div>
                      )}
                      <div className="flex justify-between"><span>Round Off</span><span>₹{Number(saleData.round_off ?? 0).toFixed(2)}</span></div>
                      <hr className="border-dashed" />
                      <div className="flex justify-between text-base font-bold">
                        <span>NET PAYABLE</span>
                        <span>₹{Number(saleData.grand_total ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-sm font-semibold">
                      THANKS FOR SHOPPING {saleData.customer_name}
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center text-sm text-error">Receipt data not found.</div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-600">
                <Button variant="outlined" onClick={onClose}>Close</Button>
                <Button color="primary" className="gap-2" onClick={handlePrint} disabled={!saleData}>
                  <PrinterIcon className="size-4" /> Print
                </Button>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
