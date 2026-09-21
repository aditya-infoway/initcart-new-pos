// src/app/pages/stock-transfer/stock-transfer-excel-import-export/index.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  DocumentIcon,
  LockClosedIcon,
  BuildingOffice2Icon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Swal from "sweetalert2";
import jsPDF from "jspdf";

import { Page } from "@/components/shared/Page";
import { Button, Card } from "@/components/ui";
import { Post, Get, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";
import { usePermission } from "@/hooks/usePermissions";
import { useBranchLocationCheck } from "@/hooks/useBranchLocationCheck";

// ── Types ────────────────────────────────────────────────────────────────
interface DestinationBranch {
  id: number;
  branch_name: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  address?: string;
  pincode?: string;
  owner_name?: string;
}

// ── Helper: HTML escape (Swal html receives server/Excel text) ───────────
const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// ── Helper: Read JSON error hidden inside a Blob (for responseType blob) ─
const readDownloadError = async (error: any): Promise<string> => {
  try {
    const data = error?.response?.data;
    if (data instanceof Blob) {
      const parsed = JSON.parse(await data.text());
      return (
        parsed.error ||
        parsed.message ||
        parsed.detail ||
        "Failed to download template"
      );
    }
    return (
      data?.error || data?.detail || data?.message || "Failed to download template"
    );
  } catch {
    return "Failed to download template";
  }
};

// ── Helper: Download Error Report PDF ────────────────────────────────────
const downloadErrorReportPdf = (
  errors: string[],
  title: string = "Stock Transfer Import Errors"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 20;

  doc.setFontSize(18);
  doc.setTextColor(180, 30, 30);
  doc.text("Import Errors — " + title, marginX, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`Generated: ${new Date().toLocaleString()}`, marginX, y);
  y += 8;
  doc.text(`Total Errors: ${errors.length}`, marginX, y);
  y += 12;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Error Details:", marginX, y);
  y += 8;

  doc.setFontSize(10);
  errors.forEach((err, idx) => {
    const lines = doc.splitTextToSize(
      `${idx + 1}. ${err}`,
      pageWidth - marginX * 2
    ) as string[];
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, marginX, y);
      y += 6;
    });
    y += 2;
  });

  doc.addPage();
  y = 20;
  doc.setFontSize(14);
  doc.setTextColor(30, 100, 30);
  doc.text("Common Fixes", marginX, y);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  [
    "Fill Qty only for the items you want to transfer — leave Qty blank to skip a row.",
    "Qty must be a number greater than 0 (decimals allowed, up to 2 places, e.g. 2.5) and cannot exceed the Available Stock shown in that row.",
    "Discount % is optional — a number between 0 and 100. Leave blank for no discount.",
    "Rate (Branch Price) is read-only. The current branch price is always used, whatever is in the sheet.",
    "Transfer Date must be filled in the first data row (a valid date, e.g. 20-09-2026).",
    "Don't edit the Item Variant name — the sheet is pre-filled with your current stock.",
    "The same item/variant cannot appear twice with Qty filled — combine the quantity instead.",
    "If an item shows 'no Branch Price set', set its branch price in item master and download a fresh template.",
    "Use the template downloaded for the destination branch — don't add or remove columns.",
  ].forEach((tip) => {
    const lines = doc.splitTextToSize(
      `• ${tip}`,
      pageWidth - marginX * 2
    ) as string[];
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, marginX, y);
      y += 6;
    });
    y += 2;
  });

  doc.save(`stock-transfer-import-errors-${Date.now()}.pdf`);
};

// ── Helper: normalize errors ─────────────────────────────────────────────
const normalizeErrors = (raw: any): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((e) => (typeof e === "string" ? e : JSON.stringify(e)));
  }
  if (typeof raw === "string") return [raw];
  if (typeof raw === "object") {
    const out: string[] = [];
    for (const key in raw) {
      const val = raw[key];
      if (typeof val === "string") out.push(`${key}: ${val}`);
      else if (Array.isArray(val))
        out.push(...val.map((v: any) => `${key}: ${v}`));
    }
    return out;
  }
  return [];
};

export default function StockTransferExcelImportExport() {
  const navigate = useNavigate();

  // ── Permission check ──────────────────────────────────────────────────
  const { canAdd, canView } = usePermission("/stockTransferExcel");
  const { checkLocation, isLoading: locationLoading } =
    useBranchLocationCheck();

  const [branches, setBranches] = useState<DestinationBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Load destination branches ────────────────────────────────────────
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = (await Get("pos/stock-transfer-excel/branches/")) as any;
        const data = response?.data ?? response;
        setBranches(data?.data || data || []);
      } catch (error) {
        console.error("Failed to load branches:", error);
        toasterrormsg("Failed to load branches");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const selectedBranch = branches.find(
    (b) => String(b.id) === selectedBranchId
  );

  // ── Shared detailed validation modal ─────────────────────────────────
  const showImportErrors = (rawErrors: any, fallbackMessage?: string) => {
    let errors = normalizeErrors(rawErrors);
    if (errors.length === 0) {
      errors = [
        fallbackMessage ||
          "Import failed. Please check the file format and try again.",
      ];
    }

    const errorListHtml = errors
      .map(
        (err) =>
          `<li class="text-red-600 text-sm">${escapeHtml(err)}</li>`
      )
      .join("");

    Swal.fire({
      title: "Import Failed!",
      width: 700,
      html: `
        <div class="text-left">
          <p class="text-red-600 font-semibold text-sm mb-2">Found ${errors.length} error(s)</p>
          <hr class="my-2">
          <div class="max-h-60 overflow-y-auto bg-gray-50 dark:bg-dark-800 rounded-lg p-2">
            <ul class="list-disc pl-4 space-y-1">${errorListHtml}</ul>
          </div>
          <div class="mt-4">
            <button id="download-error-pdf-btn" type="button"
              class="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              Download Error Report (PDF)
            </button>
          </div>
        </div>
      `,
      icon: "error",
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Close",
      didOpen: () => {
        document
          .getElementById("download-error-pdf-btn")
          ?.addEventListener("click", () =>
            downloadErrorReportPdf(errors, "Stock Transfer Import")
          );
      },
    });
  };

  // ── Download Template ────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    if (!canAdd && !canView) {
      toasterrormsg("You don't have permission to download template");
      return;
    }
    if (!selectedBranchId) {
      toasterrormsg("Please select a destination branch first");
      return;
    }

    setDownloading(true);
    try {
      const response = (await Get("pos/stock-transfer-excel/template/", {
        params: { to_branch_id: selectedBranchId },
        responseType: "blob",
      })) as any;

      const blob = response?.data ?? response;
      const url = window.URL.createObjectURL(
        blob instanceof Blob ? blob : new Blob([blob])
      );
      const link = document.createElement("a");
      link.href = url;
      const safeName = (selectedBranch?.branch_name || "branch").replace(
        /[^a-z0-9]+/gi,
        "_"
      );
      link.setAttribute("download", `stock_transfer_${safeName}_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toastsuccessmsg("Template downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toasterrormsg(await readDownloadError(error));
    } finally {
      setDownloading(false);
    }
  };

  // ── Import Stock Transfer ────────────────────────────────────────────
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!canAdd) {
      toasterrormsg("You don't have permission to import stock transfers");
      input.value = "";
      return;
    }
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toasterrormsg("Please upload an Excel file (.xlsx or .xls)");
      input.value = "";
      return;
    }

    // Manual "Create Transfer" jaisa hi branch location check
    const locationOk = await checkLocation();
    if (!locationOk) {
      input.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = (await Post(
        "pos/stock-transfer-excel/import/",
        formData,
        true
      )) as any;
      const data = response?.data ?? response;

      // CASE 1 — Post() resolved but backend says success:false
      if (!data?.success) {
        showImportErrors(
          data?.errors,
          data?.message || data?.error || data?.detail
        );
        return;
      }

      const transfers = data.transfers || [];
      const rows = transfers
        .map(
          (t: any) =>
            `<tr>
              <td class="border px-3 py-1.5 text-sm">${escapeHtml(t.transfer_no || "—")}</td>
              <td class="border px-3 py-1.5 text-sm">${escapeHtml(t.to_branch || "—")}</td>
              <td class="border px-3 py-1.5 text-sm">${escapeHtml(t.transfer_date || "—")}</td>
              <td class="border px-3 py-1.5 text-sm text-center">${escapeHtml(t.items_count ?? 0)}</td>
              <td class="border px-3 py-1.5 text-sm text-center">${escapeHtml(t.total_quantity ?? 0)}</td>
              <td class="border px-3 py-1.5 text-sm text-right font-semibold">₹${Number(t.total_net || 0).toFixed(2)}</td>
            </tr>`
        )
        .join("");

      await Swal.fire({
        title: "Import Successful!",
        width: 800,
        html: `
          <div class="text-left">
            <p class="text-emerald-600 font-semibold text-sm mb-2">${escapeHtml(data.message || `${transfers.length} stock transfer(s) created successfully`)}</p>
            <p class="text-xs text-gray-500 mb-2">Transfer is created as Pending. Stock moves when the destination branch verifies it.</p>
            <div class="max-h-72 overflow-y-auto border rounded-lg">
              <table class="w-full text-sm border-collapse">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Transfer No</th>
                    <th class="border px-3 py-2 text-left text-xs font-semibold text-gray-600">To Branch</th>
                    <th class="border px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                    <th class="border px-3 py-2 text-center text-xs font-semibold text-gray-600">Items</th>
                    <th class="border px-3 py-2 text-center text-xs font-semibold text-gray-600">Qty</th>
                    <th class="border px-3 py-2 text-right text-xs font-semibold text-gray-600">Net Total</th>
                  </tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="6" class="text-center py-4 text-gray-400">No transfers found</td></tr>'}</tbody>
              </table>
            </div>
          </div>
        `,
        icon: "success",
        confirmButtonColor: "#22c55e",
        confirmButtonText: "View Transfers",
      });
      navigate("/stockTransfer");
    } catch (error: any) {
      console.error("Stock transfer import error:", error);

      const raw =
        error?.response?.data?.errors ??
        error?.response?.data?.non_field_errors ??
        error?.data?.errors ??
        error?.errors ??
        error?.response?.data ??
        error?.data;

      const fallback =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.detail ||
        error?.message;

      showImportErrors(raw, fallback);
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <Page title="Stock Transfer — Excel Import/Export">
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
                Stock Transfer — Excel Import/Export
              </h1>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Bulk create a Stock Transfer to a branch (with multiple items
                and discount) via Excel
              </p>
            </div>
          </div>
        </div>

        {/* ─── Permission Denied Banner ─── */}
        {!canAdd && !canView && (
          <div className="px-(--margin-x) mt-4">
            <Card
              skin="bordered"
              className="p-4 bg-red-50/70 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
            >
              <div className="flex items-start gap-3">
                <LockClosedIcon className="size-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">
                    Access Restricted
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300/80 mt-0.5">
                    You don't have permission to access this page. Please
                    contact your administrator.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─── Info Banner ─── */}
        {(canAdd || canView) && (
          <div className="px-(--margin-x) mt-4">
            <Card
              skin="bordered"
              className="p-4 bg-blue-50/70 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30"
            >
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="size-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                    How the template works
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300/80 space-y-0.5 list-disc pl-4 mt-1">
                    <li>
                      Select the destination branch below, then download its
                      template
                    </li>
                    <li>
                      The template is pre-filled with every current item in
                      your branch stock — one row per item
                    </li>
                    <li>
                      Item Variant, HSN, Unit, Tax %, Available Stock and Rate
                      are{" "}
                      <span className="font-semibold">
                        locked reference columns
                      </span>{" "}
                      — don't edit them
                    </li>
                    <li>
                      Fill <span className="font-medium">Qty</span> only for the
                      items you want to transfer — decimals are allowed (up to 2
                      places, e.g. 2.5) — leave Qty blank on the rest
                    </li>
                    <li>
                      Discount % is optional (0–100) — GST is calculated on the
                      discounted rate, same as the New Transfer form
                    </li>
                    <li>
                      Transfer Date and Note are filled once, in the first data
                      row
                    </li>
                    <li>
                      Transfer No. generation and GST calculation happen
                      automatically on import
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─── Good to know Banner ─── */}
        {(canAdd || canView) && (
          <div className="px-(--margin-x) mt-4">
            <Card
              skin="bordered"
              className="p-4 bg-amber-50/70 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30"
            >
              <div className="flex items-start gap-3">
                <ArrowsRightLeftIcon className="size-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300/90">
                  <span className="font-semibold">Good to know: </span>
                  Rate is read-only. The current Branch Price of each item is
                  always used on import, exactly like the New Transfer form —
                  only Qty and Discount % are yours to change.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ─── Branch Selection ─── */}
        {(canAdd || canView) && (
          <div className="px-(--margin-x) mt-5">
            <Card skin="bordered" className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BuildingOffice2Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-800 dark:text-dark-100 text-sm">
                  Select Destination Branch
                </h3>
              </div>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={loadingBranches}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
              >
                <option value="">
                  {loadingBranches
                    ? "Loading branches..."
                    : "-- Select a destination branch --"}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                    {b.city ? ` — ${b.city}` : ""}
                  </option>
                ))}
              </select>

              {selectedBranch && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-dark-300 bg-gray-50 dark:bg-dark-800 rounded-lg p-3">
                  <div>
                    <span className="font-medium text-gray-800 dark:text-dark-100">
                      Owner:
                    </span>{" "}
                    {selectedBranch.owner_name || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-dark-100">
                      Phone:
                    </span>{" "}
                    {selectedBranch.phone || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-dark-100">
                      Email:
                    </span>{" "}
                    {selectedBranch.email || "—"}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-dark-100">
                      State:
                    </span>{" "}
                    {selectedBranch.state || "—"}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-800 dark:text-dark-100">
                      Address:
                    </span>{" "}
                    {selectedBranch.address || "—"}
                    {selectedBranch.pincode
                      ? `, ${selectedBranch.pincode}`
                      : ""}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ─── Action Cards ─── */}
        {(canAdd || canView) && (
          <div className="px-(--margin-x) mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Download Template */}
            <Card
              skin="bordered"
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-600 bg-emerald-50/70 dark:bg-emerald-900/20 flex items-center gap-2">
                <DocumentArrowDownIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-800 dark:text-dark-100 text-sm">
                  Download Template
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 dark:text-dark-300 mb-4">
                  Generates a template for the selected branch, pre-filled with
                  your current branch's items.
                </p>
                <Button
                  color="success"
                  className="w-full gap-2"
                  disabled={downloading || !selectedBranchId}
                  onClick={handleDownloadTemplate}
                >
                  <DocumentArrowDownIcon className="size-4" />
                  {downloading ? "Downloading..." : "Download Template"}
                </Button>
              </div>
            </Card>

            {/* Import Stock Transfer */}
            {canAdd && (
              <Card
                skin="bordered"
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-600 bg-emerald-50/70 dark:bg-emerald-900/20 flex items-center gap-2">
                  <ArrowUpTrayIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-gray-800 dark:text-dark-100 text-sm">
                    Import Stock Transfer
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 dark:text-dark-300 mb-4">
                    Upload the filled Excel file to create the stock transfer.
                  </p>
                  <label
                    className={clsx(
                      "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                      "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600",
                      "text-white shadow-sm",
                      uploading || locationLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    )}
                  >
                    <ArrowUpTrayIcon className="size-4" />
                    {uploading
                      ? "Uploading..."
                      : locationLoading
                        ? "Checking location..."
                        : "Choose File & Import"}
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleImport}
                      disabled={uploading || locationLoading}
                      className="hidden"
                    />
                  </label>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ─── Auto Features Info ─── */}
        {(canAdd || canView) && (
          <div className="px-(--margin-x) mt-5">
            <Card
              skin="bordered"
              className="p-4 border-emerald-200/70 dark:border-emerald-800/30 bg-emerald-50/50 dark:bg-emerald-900/10"
            >
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="size-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                    What happens automatically on import
                  </h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300/80 mt-1">
                    The file is created through the same Stock Transfer logic
                    as the "New Transfer" form: Transfer No. generation,
                    automatic creation of the item + variants on the
                    destination branch (so verify only needs to add stock, no
                    duplicates), and CGST/SGST vs IGST calculation based on
                    branch state — on the discounted Branch Price, exactly like
                    the form. The transfer is created as Pending and the
                    destination branch verifies it as usual.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}