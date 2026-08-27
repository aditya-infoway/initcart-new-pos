// src/app/pages/purchase-master/purchase-excel-import-export/index.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  DocumentIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Swal from "sweetalert2";

import { Page } from "@/components/shared/Page";
import { Button, Card } from "@/components/ui";
import { Post, Get, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";

export default function PurchaseExcelImportExport() {
  const navigate = useNavigate();

  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const response = await Get("pos/purchase-excel/template/", {
        responseType: "blob",
      }) as any;

      const blob = response?.data ?? response;
      const url = window.URL.createObjectURL(
        blob instanceof Blob ? blob : new Blob([blob])
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "purchase_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toastsuccessmsg("Template downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toasterrormsg("Failed to download template");
    } finally {
      setDownloading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toasterrormsg("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // ✅ SAHI - Post(url, data) - headers automatically set for FormData
      const response = await Post("pos/purchase-excel/import/", formData) as any;

      const data = response?.data ?? response;

      if (data?.success) {
        const purchases = data.purchases || [];
        const rows = purchases
          .map(
            (p: any) =>
              `<tr>
                <td class="border px-3 py-1.5 text-sm">${p.billNo || "—"}</td>
                <td class="border px-3 py-1.5 text-sm">${p.party || "—"}</td>
                <td class="border px-3 py-1.5 text-sm text-center">${p.items_count || 0}</td>
                <td class="border px-3 py-1.5 text-sm text-right font-semibold">₹${(p.grand_total || 0).toFixed(2)}</td>
              </tr>`
          )
          .join("");

        await Swal.fire({
          title: "✅ Import Successful!",
          width: 700,
          html: `
            <div class="text-left">
              <p class="text-emerald-600 font-semibold text-sm mb-3">${data.message || `${purchases.length} purchase(s) created successfully`}</p>
              <div class="max-h-72 overflow-y-auto border rounded-lg">
                <table class="w-full text-sm border-collapse">
                  <thead class="bg-gray-50 sticky top-0">
                    <tr>
                      <th class="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Bill No</th>
                      <th class="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Party</th>
                      <th class="border px-3 py-2 text-center text-xs font-semibold text-gray-600">Items</th>
                      <th class="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Grand Total</th>
                    </tr>
                  </thead>
                  <tbody>${rows || '<tr><td colspan="4" class="text-center py-4 text-gray-400">No purchases found</td></tr>'}</tbody>
                </table>
              </div>
            </div>
          `,
          icon: "success",
          confirmButtonColor: "#22c55e",
          confirmButtonText: "View Purchases",
        });
        navigate("/purchase/purchase-entry");
      } else {
        toasterrormsg(data?.message || "Import failed");
      }
    } catch (error: any) {
      console.error("Purchase import error:", error);

      const errData = error?.response?.data;
      if (errData?.errors && Array.isArray(errData.errors)) {
        const errors = errData.errors;
        const errorList = errors
          .map((err: string) => `<li class="text-red-600 text-sm">• ${err}</li>`)
          .join("");

        await Swal.fire({
          title: "❌ Import Failed!",
          html: `
            <div class="text-left">
              <p class="text-red-600 font-semibold text-sm">Found ${errors.length} error(s)</p>
              <hr class="my-3">
              <div class="max-h-60 overflow-y-auto">
                <ul class="list-none pl-0 space-y-1">${errorList}</ul>
              </div>
            </div>
          `,
          icon: "error",
          confirmButtonColor: "#ef4444",
          confirmButtonText: "OK",
        });
      } else {
        toasterrormsg(errData?.error || errData?.message || "Failed to import purchases");
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Page title="Purchase — Excel Import/Export">
      <div className="transition-content w-full pb-8">
        {/* ─── Header ─── */}
        <div className="px-(--margin-x) flex flex-wrap items-center gap-4 pt-4 pb-2">
          <Button
            variant="outlined"
            className="h-8 gap-2 rounded-md px-3 text-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="size-4" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <DocumentIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-dark-100">
                Purchase — Excel Import/Export
              </h1>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Bulk create purchase entries (with multiple items each) via Excel
              </p>
            </div>
          </div>
        </div>

        {/* ─── Info Banner ─── */}
        <div className="px-(--margin-x) mt-4">
          <Card skin="bordered" className="p-4 bg-blue-50/70 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                  How the template works
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300/80 space-y-0.5 list-disc pl-4 mt-1">
                  <li>
                    <span className="font-medium">Peach columns</span> (Party, Terms, Cash/Bank Account, Freight, etc.) — fill only on the <span className="font-semibold">FIRST row</span> of each purchase
                  </li>
                  <li>
                    <span className="font-medium">Blue columns</span> (Item, Qty, Price, Discount%) — fill on <span className="font-semibold">every item row</span>
                  </li>
                  <li>Typing a new Party Name starts a brand-new purchase entry</li>
                  <li>Bill number, GST/discount calculation happen automatically on import — don't type them</li>
                  <li>Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Action Cards ─── */}
        <div className="px-(--margin-x) mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Download Template */}
          <Card skin="bordered" className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-600 bg-emerald-50/70 dark:bg-emerald-900/20 flex items-center gap-2">
              <DocumentArrowDownIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-gray-800 dark:text-dark-100 text-sm">
                Download Template
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 dark:text-dark-300 mb-4">
                Party, Cash Account, Bank Account and Item dropdowns are pre-filled with your current data.
              </p>
              <Button
                color="success"
                className="w-full gap-2"
                disabled={downloading}
                onClick={handleDownloadTemplate}
              >
                <DocumentArrowDownIcon className="size-4" />
                {downloading ? "Downloading..." : "Download Template"}
              </Button>
            </div>
          </Card>

          {/* Import Purchases */}
          <Card skin="bordered" className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-600 bg-emerald-50/70 dark:bg-emerald-900/20 flex items-center gap-2">
              <ArrowUpTrayIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-gray-800 dark:text-dark-100 text-sm">
                Import Purchases
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 dark:text-dark-300 mb-4">
                Upload the filled Excel file to bulk-create purchase entries.
              </p>
              <label
                className={clsx(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                  "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600",
                  "text-white shadow-sm",
                  uploading && "opacity-50 cursor-not-allowed"
                )}
              >
                <ArrowUpTrayIcon className="size-4" />
                {uploading ? "Uploading..." : "Choose File & Import"}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </Card>
        </div>

        {/* ─── Auto Features Info ─── */}
        <div className="px-(--margin-x) mt-5">
          <Card skin="bordered" className="p-4 border-emerald-200/70 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="size-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                  What happens automatically on import
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300/80 mt-1">
                  Purchase voucher (Bill No) generation, GST/CGST/SGST/IGST calculation with discount, and
                  auto Cash/Bank payment creation (PCP/PBP) for Cash/Bank terms — exactly like creating a
                  purchase from the normal Purchase Entry form.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}