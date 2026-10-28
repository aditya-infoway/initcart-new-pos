// src/app/pages/reports/sales-profit-report/index.tsx
import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  SortingState, useReactTable, ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowDownTrayIcon, ArrowPathIcon, BanknotesIcon, BuildingOfficeIcon,
  CurrencyRupeeIcon, EyeIcon, FunnelIcon, MagnifyingGlassIcon,
  ReceiptRefundIcon, ShoppingCartIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

import { Page } from "@/components/shared/Page";
import { Button, Input, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { Get, toasterrormsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import { useAuthContext } from "@/app/contexts/auth/context";
import {
  SalesBill, Branch, ProfitSummary, FilterOptions,
  PAGE_SIZE_OPTIONS, mapApiBill,
  termsColor, gstColor, profitBg, profitColor,
} from "./data";

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ bill, onClose }: { bill: SalesBill | null; onClose: () => void }) {
  const totals = useMemo(() => ({
    netAmount: bill?.lineItems.reduce((s, l) => s + l.netAmount, 0) ?? 0,
    salesNet: bill?.lineItems.reduce((s, l) => s + l.salesNet, 0) ?? 0,
    purchaseCost: bill?.lineItems.reduce((s, l) => s + l.purchaseCost, 0) ?? 0,
    lineProfit: bill?.lineItems.reduce((s, l) => s + l.lineProfit, 0) ?? 0,
  }), [bill]);

  return (
    <Transition appear show={!!bill} as={Fragment}>
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
          className="fixed top-0 right-0 flex h-full w-full lg:max-w-[80%] xl:max-w-[72%] transform-gpu flex-col bg-white dark:bg-dark-700"
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between bg-primary px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Line Items — {bill?.billNo}
              </h3>
              <p className="mt-0.5 text-xs text-white/70">
                {bill?.customerName} · {formatDateDDMMYYYY(bill?.billDate ?? "")} · {bill?.terms}
              </p>
            </div>

            <Button onClick={onClose} variant="flat" isIcon
              className="size-8 rounded-full text-white hover:bg-white/10">
              <XMarkIcon className="size-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="hide-scrollbar grow overflow-y-auto">
            {/* 3 summary cards */}
            <div className="px-5 py-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "BILL AMOUNT",
                  value: bill?.billAmount ?? 0,
                  bg: "from-primary-500 to-primary-700",
                },
                {
                  label: "PURCHASE COST",
                  value: bill?.purchaseCost ?? 0,
                  bg: "from-rose-500 to-rose-700",
                },
                {
                  label: "PROFIT",
                  value: bill?.profit ?? 0,
                  bg: (bill?.profit ?? 0) >= 0
                    ? "from-emerald-500 to-emerald-700"
                    : "from-red-500 to-red-700",
                  pct: bill?.profitPercent,
                },
              ].map(({ label, value, bg, pct }) => (
                <div
                  key={label}
                  className={clsx(
                    "relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-md",
                    bg
                  )}
                >
                  <div className="pointer-events-none absolute -right-2 -top-2 size-12 rounded-full bg-white/10" />
                  <p className="text-lg font-bold tabular-nums">
                    ₹
                    {Number(value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                    {pct != null && (
                      <span className="ml-1 text-xs font-normal">
                        ({Number(pct).toFixed(1)}%)
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-white/80">{label}</p>
                </div>
              ))}
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto px-5">
              <Table hoverable className="w-full text-left">
                <THead>
                  <Tr>
                    {[
                      "SR", "Item Name", "HSN", "Qty", "Sale Price", "Per",
                      "Disc%", "Tax%", "Net Amount", "Sales Net",
                      "Purchase Price", "Purchase Cost", "Line Profit",
                    ].map(h => (
                      <Th key={h} className="bg-gray-100 dark:bg-dark-800 text-xs font-semibold uppercase text-gray-600 dark:text-dark-100 whitespace-nowrap">
                        {h}
                      </Th>
                    ))}
                  </Tr>
                </THead>
                <TBody>
                  {!bill?.lineItems.length ? (
                    <Tr>
                      <Td colSpan={13} className="py-10 text-center text-sm text-gray-400">
                        No line items available.
                      </Td>
                    </Tr>
                  ) : bill.lineItems.map((l, i) => (
                    <Tr key={l.id ?? i} className="border-b border-gray-200 dark:border-dark-500">
                      <Td className="text-gray-400">{i + 1}</Td>
                      <Td className="font-medium text-gray-800 dark:text-dark-100 whitespace-nowrap">{l.itemName}</Td>
                      <Td className="text-xs text-gray-500">{l.hsn}</Td>
                      <Td className="text-center font-semibold text-gray-800 dark:text-dark-100">{l.qty}</Td>
                      <Td className="font-semibold tabular-nums text-gray-800 dark:text-dark-100">₹{l.salePrice.toFixed(2)}</Td>
                      <Td className="text-gray-500">{l.per}</Td>
                      <Td className="text-gray-500">{l.discPercent}%</Td>
                      <Td className="font-medium text-amber-600">{l.taxPercent}%</Td>
                      <Td className="font-semibold tabular-nums text-primary-600 dark:text-primary-400">₹{l.netAmount.toFixed(2)}</Td>
                      <Td className="font-semibold tabular-nums text-primary-600 dark:text-primary-400">₹{l.salesNet.toFixed(2)}</Td>
                      <Td className="font-medium tabular-nums text-amber-600">₹{l.purchasePrice.toFixed(2)}</Td>
                      <Td className="font-medium tabular-nums text-amber-600">₹{l.purchaseCost.toFixed(2)}</Td>
                      <Td className={clsx("font-bold tabular-nums",
                        l.lineProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {l.lineProfit >= 0 ? "+" : ""}₹{l.lineProfit.toFixed(2)}
                      </Td>
                    </Tr>
                  ))}
                </TBody>

                {(bill?.lineItems.length ?? 0) > 0 && (
                  <TBody>
                    <Tr className="border-t-2 border-gray-300 dark:border-dark-500">
                      <Td colSpan={8} className="bg-gray-50 dark:bg-dark-800 text-xs font-bold uppercase text-gray-600 dark:text-dark-200">
                        TOTAL
                      </Td>
                      <Td className="bg-gray-50 dark:bg-dark-800 font-bold tabular-nums text-primary-600 dark:text-primary-400">
                        ₹{totals.netAmount.toFixed(2)}
                      </Td>
                      <Td className="bg-gray-50 dark:bg-dark-800 font-bold tabular-nums text-primary-600 dark:text-primary-400">
                        ₹{totals.salesNet.toFixed(2)}
                      </Td>
                      <Td className="bg-gray-50 dark:bg-dark-800" />
                      <Td className="bg-gray-50 dark:bg-dark-800 font-bold tabular-nums text-amber-600">
                        ₹{totals.purchaseCost.toFixed(2)}
                      </Td>
                      <Td className={clsx("bg-gray-50 dark:bg-dark-800 font-bold tabular-nums",
                        totals.lineProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                        {totals.lineProfit >= 0 ? "+" : ""}₹{totals.lineProfit.toFixed(2)}
                      </Td>
                    </Tr>
                  </TBody>
                )}
              </Table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-end border-t border-gray-200 px-5 py-4 dark:border-dark-600">
            <Button variant="outlined" className="px-8" onClick={onClose}>Close</Button>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SalesProfitReportPage() {
  const { user } = useAuthContext();
  const role = (user as any)?.role;
  const isSuperAdmin = role === "superadmin";
  const isEmployee = role === "employee";
  const canViewAllBranches = isSuperAdmin || isEmployee;

  const [allItems, setAllItems] = useState<SalesBill[]>([]);
  const [filteredItems, setFilteredItems] = useState<SalesBill[]>([]);
  const [loading, setLoading] = useState(true);

  // search (only bill no / customer, same as old)
  const [searchTerm, setSearchTerm] = useState("");

  // filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({ dateFrom: "", dateTo: "" });

  // pagination (client-side — same as old)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // drawer
  const [selectedBill, setSelectedBill] = useState<SalesBill | null>(null);

  // branch
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedBranchName, setSelectedBranchName] = useState<string>("All Branches");

  // table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // API summary — used ONLY when no filters/search active
  const [apiSummary, setApiSummary] = useState<ProfitSummary | null>(null);

  // fetch branches
  useEffect(() => {
    if (!canViewAllBranches) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await Get("pos/branches/") as any;
        const body = res?.data ?? res;
        const list: Branch[] = Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];
        if (!cancelled) setBranches(list);
      } catch (e) {
        console.error("Branches fetch failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [canViewAllBranches]);

  const fetchData = useCallback(async (branchId: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, page_size: 1000 };
      if (branchId) params.branch_id = branchId;

      const res = await Get("pos/sales-bill-wise-profit/", params) as any;
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body?.results?.data)
        ? body.results.data
        : Array.isArray(body?.results) ? body.results
          : Array.isArray(body?.data) ? body.data
            : Array.isArray(body) ? body : [];

      const summary = body?.results?.summary;
      setApiSummary(summary
        ? {
            billAmount: Number(summary.total_sales_amount ?? 0),
            salesNet: Number(summary.total_sales_net ?? 0),
            purchaseCost: Number(summary.total_purchase_cost ?? 0),
            profit: Number(summary.total_profit ?? 0),
          }
        : null);

      const mapped = rows.map(mapApiBill);
      setAllItems(mapped);
      setFilteredItems(mapped);
    } catch {
      toasterrormsg("Failed to fetch sales profit report.");
      setAllItems([]);
      setFilteredItems([]);
      setApiSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial fetch
  useEffect(() => { fetchData(selectedBranchId); }, [fetchData, selectedBranchId]);

  const handleBranchChange = (val: string) => {
    const name = branches.find(b => String(b.id) === val)?.branch_name || "All Branches";
    setSelectedBranchId(val);
    setSelectedBranchName(name);
    setCurrentPage(1);
  };

  // client-side filter — same rules as old
  useEffect(() => {
    let f = [...allItems];
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      f = f.filter(
        i =>
          i.billNo?.toLowerCase().includes(t) ||
          i.customerName?.toLowerCase().includes(t)
      );
    }
    if (filters.dateFrom) f = f.filter(i => i.billDate >= filters.dateFrom);
    if (filters.dateTo) f = f.filter(i => i.billDate <= filters.dateTo);
    setFilteredItems(f);
    setCurrentPage(1);
  }, [searchTerm, filters, allItems]);

  // totals — API summary only when no filter/search; else computed from filtered
  const hasActiveFilters = !!(filters.dateFrom || filters.dateTo);
  const usingFiltered = !!searchTerm.trim() || hasActiveFilters;
  const totals = useMemo<ProfitSummary>(() => {
    if (!usingFiltered && apiSummary) return apiSummary;
    return {
      billAmount: filteredItems.reduce((s, i) => s + (i.billAmount || 0), 0),
      salesNet: filteredItems.reduce((s, i) => s + (i.salesNet || 0), 0),
      purchaseCost: filteredItems.reduce((s, i) => s + (i.purchaseCost || 0), 0),
      profit: filteredItems.reduce((s, i) => s + (i.profit || 0), 0),
    };
  }, [filteredItems, apiSummary, usingFiltered]);

  const totalItems = filteredItems.reduce((s, i) => s + (i.items || 0), 0);
  const overallProfitPercent = totals.salesNet > 0
    ? (totals.profit / totals.salesNet) * 100
    : 0;

  // client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Excel export — same as old (xlsx lib, TOTAL row)
  const exportToExcel = () => {
    const rows: any[] = filteredItems.map((item, idx) => ({
      SR: idx + 1,
      "Bill No": item.billNo,
      "Bill Date": item.billDate,
      Customer: item.customerName,
      Items: item.items,
      "Bill Amount": item.billAmount.toFixed(2),
      "Sales Net": item.salesNet.toFixed(2),
      "Purchase Cost": item.purchaseCost.toFixed(2),
      Profit: item.profit.toFixed(2),
      "Profit %": `${item.profit >= 0 ? "+" : ""}${item.profitPercent.toFixed(2)}%`,
      Terms: item.terms,
      "GST Type": item.gstType,
    }));

    rows.push({
      SR: "TOTAL",
      "Bill No": `${filteredItems.length} bills`,
      "Bill Date": "",
      Customer: "",
      Items: totalItems,
      "Bill Amount": totals.billAmount.toFixed(2),
      "Sales Net": totals.salesNet.toFixed(2),
      "Purchase Cost": totals.purchaseCost.toFixed(2),
      Profit: totals.profit.toFixed(2),
      "Profit %": `${overallProfitPercent >= 0 ? "+" : ""}${overallProfitPercent.toFixed(2)}%`,
      Terms: "",
      "GST Type": "",
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 28 }, { wch: 8 },
      { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 12 },
      { wch: 10 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profit Report");
    XLSX.writeFile(wb, `Profit_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const clearFilters = () => setFilters({ dateFrom: "", dateTo: "" });

  // ── Columns ──
  const columns = useMemo<ColumnDef<SalesBill>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<SalesBill, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(currentPage - 1) * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      id: "billNo", accessorKey: "billNo", header: "Bill No",
      cell: ({ getValue, table }: CellContext<SalesBill, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "billDate", accessorKey: "billDate", header: "Bill Date",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "customerName", accessorKey: "customerName", header: "Customer Name",
      cell: ({ getValue, table }: CellContext<SalesBill, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-gray-800 dark:text-dark-100">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "items", accessorKey: "items", header: "Items",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => (
        <span className="mx-auto inline-flex items-center justify-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          {String(getValue() ?? "0")}
        </span>
      ),
    },
    {
      id: "billAmount", accessorKey: "billAmount", header: "Bill Amount",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => (
        <span className="font-semibold tabular-nums text-gray-800 dark:text-dark-100">
          ₹{Number(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "salesNet", accessorKey: "salesNet", header: "Sales Net",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => (
        <span className="font-medium tabular-nums text-primary-600 dark:text-primary-400">
          ₹{Number(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "purchaseCost", accessorKey: "purchaseCost", header: "Purchase Cost",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => (
        <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
          ₹{Number(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "profit", accessorKey: "profit", header: "Profit",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => {
        const v = Number(getValue() ?? 0);
        return (
          <span className={clsx("font-bold tabular-nums", profitColor(v))}>
            {v >= 0 ? "+" : ""}₹{v.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "profitPercent", accessorKey: "profitPercent", header: "Profit %",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => {
        const v = Number(getValue() ?? 0);
        return (
          <span className={clsx("rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", profitBg(v))}>
            {v >= 0 ? "+" : ""}{v.toFixed(1)}%
          </span>
        );
      },
    },
    {
      id: "terms", accessorKey: "terms", header: "Terms",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => {
        const v = String(getValue() ?? "");
        return (
          <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", termsColor(v))}>
            {v || "—"}
          </span>
        );
      },
    },
    {
      id: "gstType", accessorKey: "gstType", header: "GST Type",
      cell: ({ getValue }: CellContext<SalesBill, unknown>) => {
        const v = String(getValue() ?? "Unknown");
        return (
          <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-semibold", gstColor(v))}>
            {v}
          </span>
        );
      },
    },
    {
      id: "actions", header: "Detail", size: 70, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<SalesBill, unknown>) => (
        <div className="flex justify-center">
          <Button isIcon variant="flat" className="size-8 rounded-full"
            onClick={() => setSelectedBill(row.original)} title="View Detail">
            <EyeIcon className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [currentPage, pageSize]);

  // Server-side data comes already paginated client-side → feed already-paginated rows into table
  const table = useReactTable({
    data: paginatedItems,
    columns,
    state: { sorting, rowSelection },
    enableRowSelection: false,
    getRowId: (row) => String(row.id),
    filterFns: { fuzzy: fuzzyFilter },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <Page title="Sales Bill Wise Profit Report">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Sales Bill Wise Profit Report
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {canViewAllBranches && selectedBranchId && (
                <span className="font-semibold text-gray-700 dark:text-dark-100">{selectedBranchName} · </span>
              )}
              <span className="font-semibold text-gray-800 dark:text-dark-100">{filteredItems.length}</span> bills
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canViewAllBranches && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-dark-300">
                  <BuildingOfficeIcon className="size-3.5" /> Branch:
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="h-9 min-w-[160px] rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:ring-3 focus:ring-primary-500/50 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={() => setShowFilters(v => !v)}>
              <FunnelIcon className={clsx("size-4", showFilters && "text-primary")} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {[filters.dateFrom, filters.dateTo].filter(Boolean).length}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm text-red-600 border-red-200 hover:bg-red-50 dark:border-red-700/40 dark:hover:bg-red-900/20"
                onClick={clearFilters}>
                <XMarkIcon className="size-4" />
                <span>Clear</span>
              </Button>
            )}
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={exportToExcel}>
              <ArrowDownTrayIcon className="size-4 text-success-600" />
              <span>Export Excel</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={() => fetchData(selectedBranchId)} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="px-(--margin-x) mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-3 -top-3 size-20 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-16 rounded-full bg-white/10" />
            <div className="mb-3 flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-lg bg-white/20">
                <ShoppingCartIcon className="size-4 text-white" />
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {filteredItems.length} Bills
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              ₹{totals.billAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs font-medium text-white/75">Total Sales (Bill Amount)</p>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-3 -top-3 size-20 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-16 rounded-full bg-white/10" />
            <div className="mb-3 flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-lg bg-white/20">
                <CurrencyRupeeIcon className="size-4 text-white" />
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Excl. GST
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              ₹{totals.salesNet.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs font-medium text-white/75">Sales Net Amount</p>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-3 -top-3 size-20 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-16 rounded-full bg-white/10" />
            <div className="mb-3 flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-lg bg-white/20">
                <ReceiptRefundIcon className="size-4 text-white" />
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Cost
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              ₹{totals.purchaseCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs font-medium text-white/75">Total Purchase Cost</p>
          </div>

          <div className={clsx(
            "relative overflow-hidden rounded-xl p-4 text-white shadow-md",
            totals.profit >= 0
              ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
              : "bg-gradient-to-br from-red-500 to-red-700",
          )}>
            <div className="pointer-events-none absolute -right-3 -top-3 size-20 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-16 rounded-full bg-white/10" />
            <div className="mb-3 flex items-center justify-between">
              <div className="grid size-9 place-items-center rounded-lg bg-white/20">
                <BanknotesIcon className="size-4 text-white" />
              </div>
              {totals.billAmount > 0 && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  {overallProfitPercent.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {totals.profit >= 0 ? "+" : ""}₹
              {totals.profit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs font-medium text-white/75">Total Profit</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-(--margin-x) mt-4 max-w-sm">
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
            classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
            placeholder="Search bill no, customer..."
          />
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="px-(--margin-x) mt-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-600">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-200">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
                    classNames={{ input: "h-9 text-sm" }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-200">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))}
                    classNames={{ input: "h-9 text-sm" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MasterTable */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={
            loading
              ? "Loading sales profit report..."
              : usingFiltered
                ? "No records match your filters."
                : "No sales records found."
          }
        />

        {/* Client-side pagination footer */}
        {filteredItems.length > 0 && (
          <div className="px-(--margin-x) mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-300">
              <span>
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                –{" "}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, filteredItems.length)}
                </span>{" "}
                of <span className="font-medium">{filteredItems.length}</span>
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n} / page</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outlined"
                className="h-8 px-3 text-xs"
                disabled={currentPage <= 1 || loading}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              {Array.from(
                { length: Math.min(Math.max(1, totalPages), 5) },
                (_, i) => i + 1,
              ).map(p => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={clsx(
                    "size-8 rounded-lg text-xs font-medium transition-colors",
                    p === currentPage
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-dark-200 dark:hover:bg-dark-600",
                  )}
                >
                  {p}
                </button>
              ))}
              <Button
                variant="outlined"
                className="h-8 px-3 text-xs"
                disabled={currentPage >= totalPages || loading}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer bill={selectedBill} onClose={() => setSelectedBill(null)} />
    </Page>
  );
}