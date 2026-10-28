// src/app/pages/purchase-master/index.tsx
import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowDownTrayIcon, ArrowPathIcon, BanknotesIcon,
  CurrencyRupeeIcon, EyeIcon, FunnelIcon,
  MagnifyingGlassIcon, PlusIcon, ReceiptRefundIcon,
  ShoppingBagIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner"; // ✅ Standard theme toast import

import { Page } from "@/components/shared/Page";
import { Badge, Button, Input, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { Get, formatDateDDMMYYYY } from "@/ApiHelper"; // ✅ Removed toasterrormsg
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import { usePermission } from "@/hooks/usePermissions";
import { mapRow, round2, PurchaseRecord } from "./data";

const PAGE_SIZES = [10, 15, 25, 50, 100];

// ── Items Drawer (No changes) ──────────────────────────────────────────────
function ItemsDrawer({
  record,
  onClose,
}: {
  record: PurchaseRecord | null;
  onClose: () => void;
}) {
  const totalBasic = round2(record?.items.reduce((s, i) => s + Number(i.basicAmount), 0) ?? 0);
  const totalDiscount = round2(record?.items.reduce((s, i) => s + Number(i.discountAmount), 0) ?? 0);
  const totalTax = round2(record?.items.reduce((s, i) => s + Number(i.taxAmount), 0) ?? 0);
  const totalNet = round2(record?.items.reduce((s, i) => s + Number(i.netAmount), 0) ?? 0);

  return (
    <Transition appear show={!!record} as={Fragment}>
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
          className="fixed top-0 right-0 flex h-full w-full lg:max-w-[72%] xl:max-w-[65%] transform-gpu flex-col bg-white dark:bg-dark-700"
        >
          <div className="bg-primary flex shrink-0 items-center justify-between border-b border-primary/20 px-5 py-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingBagIcon className="size-5 opacity-80" />
                Purchase Bill — {record?.billNo || "—"}
              </h3>
              <p className="mt-0.5 text-sm text-white/75">
                {record?.partyName}
                {record?.date ? ` · ${formatDateDDMMYYYY(record.date)}` : ""}
                {record?.purchaseBillNo ? ` · PB# ${record.purchaseBillNo}` : ""}
              </p>
            </div>
            <Button onClick={onClose} variant="flat" isIcon
              className="size-8 rounded-full text-white hover:bg-white/10">
              <XMarkIcon className="size-5" />
            </Button>
          </div>

          <div className="hide-scrollbar grow overflow-y-auto">
            <div className="px-5 pt-5 pb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Payment Terms", value: record?.paymentTerms || "—",
                  color: record?.paymentTerms?.toLowerCase() === "cash" ? "text-emerald-600 dark:text-emerald-400"
                    : record?.paymentTerms?.toLowerCase() === "credit" ? "text-amber-600 dark:text-amber-400"
                    : "text-sky-600 dark:text-sky-400" },
                { label: "Due Date", value: record?.dueDate ? formatDateDDMMYYYY(record.dueDate) : "—",
                  color: "text-gray-700 dark:text-dark-100" },
                { label: "Total Items", value: String(record?.items.length ?? 0),
                  color: "text-primary-600 dark:text-primary-400" },
                { label: "Narration", value: record?.narration || "—",
                  color: "text-gray-600 dark:text-dark-200" },
              ].map(({ label, value, color }) => (
                <div key={label}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-500 dark:bg-dark-750">
                  <p className="text-xs text-gray-500 dark:text-dark-400">{label}</p>
                  <p className={clsx("mt-0.5 text-sm font-semibold truncate", color)}>{value}</p>
                </div>
              ))}
            </div>

            <div className="px-5 pb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Total Basic", value: totalBasic, bg: "from-primary-500 to-primary-700" },
                { label: "Total Discount", value: totalDiscount, bg: "from-rose-500 to-rose-700" },
                { label: "Total Tax", value: totalTax, bg: "from-amber-500 to-amber-600" },
                { label: "Net Total", value: totalNet, bg: "from-emerald-500 to-emerald-700" },
              ].map(({ label, value, bg }) => (
                <div key={label}
                  className={clsx("relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-md", bg)}>
                  <div className="pointer-events-none absolute -right-2 -top-2 size-12 rounded-full bg-white/10" />
                  <p className="text-lg font-bold tabular-nums">
                    ₹{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-white/80">{label}</p>
                </div>
              ))}
            </div>

            <div className="px-5 pb-4">
              <div className="rounded-xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750 divide-y divide-gray-100 dark:divide-dark-600">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500 dark:text-dark-300">Total Basic</span>
                  <span className="tabular-nums font-semibold text-gray-700 dark:text-dark-100">
                    ₹{record?.totalBasic.toFixed(2) ?? "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500 dark:text-dark-300">Total Tax</span>
                  <span className="tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                    ₹{record?.totalTax.toFixed(2) ?? "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-500 dark:text-dark-300">F + O + R</span>
                  <span className="tabular-nums font-semibold text-purple-600 dark:text-purple-400">
                    ₹{record?.for_.toFixed(2) ?? "0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 bg-primary/5 rounded-b-xl">
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-300">Grand Total</span>
                  <span className="tabular-nums text-base font-extrabold text-primary-600 dark:text-primary-400">
                    ₹{record?.grandTotal.toFixed(2) ?? "0.00"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-dark-200">
                <ReceiptRefundIcon className="size-4 text-primary-500" />
                Line Items
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                  {record?.items.length ?? 0}
                </span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-dark-500">
                <Table hoverable className="w-full min-w-[900px] text-left">
                  <THead>
                    <Tr>
                      {["#", "Item Name", "HSN", "Barcode", "Qty", "Alt Qty", "Price", "Per", "Disc%", "Basic Amt", "Disc Amt", "Tax Amt", "Net Value"].map(h => (
                        <Th key={h}
                          className="bg-primary/10 text-xs font-semibold uppercase text-primary-700 dark:bg-primary/20 dark:text-primary-300 whitespace-nowrap">
                          {h}
                        </Th>
                      ))}
                    </Tr>
                  </THead>
                  <TBody>
                    {!record?.items.length ? (
                      <Tr>
                        <Td colSpan={13} className="py-10 text-center text-sm text-gray-400 dark:text-dark-400">
                          No items found.
                        </Td>
                      </Tr>
                    ) : record.items.map((item, i) => (
                      <Tr key={i} className="border-b border-gray-100 dark:border-dark-600 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                        <Td className="text-xs text-gray-400 dark:text-dark-500">{i + 1}</Td>
                        <Td className="font-medium text-gray-800 dark:text-dark-100 whitespace-nowrap">{item.itemName || "—"}</Td>
                        <Td className="text-xs text-gray-500 dark:text-dark-300">{item.hsnCode || "—"}</Td>
                        <Td className="text-xs text-gray-500 dark:text-dark-300 font-mono">{item.barcode || "—"}</Td>
                        <Td className="text-center font-semibold tabular-nums text-gray-800 dark:text-dark-100">{item.qty}</Td>
                        <Td className="text-center tabular-nums text-gray-500 dark:text-dark-300">
                          {Number(item.altQty) > 0 ? item.altQty : "—"}
                        </Td>
                        <Td className="tabular-nums text-gray-700 dark:text-dark-200">₹{round2(item.price).toFixed(2)}</Td>
                        <Td className="text-xs text-gray-500 dark:text-dark-300">{item.unit}</Td>
                        <Td className="tabular-nums text-rose-600 dark:text-rose-400">{round2(item.discountPercent).toFixed(2)}%</Td>
                        <Td className="font-medium tabular-nums text-primary-600 dark:text-primary-400">₹{round2(item.basicAmount).toFixed(2)}</Td>
                        <Td className="tabular-nums text-rose-500 dark:text-rose-400">₹{round2(item.discountAmount).toFixed(2)}</Td>
                        <Td className="font-medium tabular-nums text-amber-600 dark:text-amber-400">₹{round2(item.taxAmount).toFixed(2)}</Td>
                        <Td className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">₹{round2(item.netAmount).toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                  {(record?.items.length ?? 0) > 0 && (
                    <TBody>
                      <Tr className="border-t-2 border-primary/20 dark:border-primary/30">
                        <Td colSpan={9}
                          className="bg-primary/5 dark:bg-primary/10 text-xs font-bold uppercase text-primary-700 dark:text-primary-300">
                          TOTAL
                        </Td>
                        <Td className="bg-primary/5 dark:bg-primary/10 font-bold tabular-nums text-primary-600 dark:text-primary-400">
                          ₹{totalBasic.toFixed(2)}
                        </Td>
                        <Td className="bg-primary/5 dark:bg-primary/10 font-bold tabular-nums text-rose-500 dark:text-rose-400">
                          ₹{totalDiscount.toFixed(2)}
                        </Td>
                        <Td className="bg-primary/5 dark:bg-primary/10 font-bold tabular-nums text-amber-600 dark:text-amber-400">
                          ₹{totalTax.toFixed(2)}
                        </Td>
                        <Td className="bg-primary/5 dark:bg-primary/10 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          ₹{totalNet.toFixed(2)}
                        </Td>
                      </Tr>
                    </TBody>
                  )}
                </Table>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-dark-500">
            <p className="text-xs text-gray-400 dark:text-dark-400">
              {record?.items.length ?? 0} item{(record?.items.length ?? 0) !== 1 ? "s" : ""} ·
              Grand Total: <span className="font-semibold text-primary-600 dark:text-primary-400">
                ₹{record?.grandTotal.toFixed(2) ?? "0.00"}
              </span>
            </p>
            <Button variant="outlined" className="px-8" onClick={onClose}>Close</Button>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PurchaseEntryPage() {
  const navigate = useNavigate();
  const { canAdd, canView } = usePermission("/Addpurchaseitem");

  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [overallTotal, setOverallTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showFilter, setShowFilter] = useState(false);
  const [filterTerms, setFilterTerms] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedRecord, setSelectedRecord] = useState<PurchaseRecord | null>(null);
  const reqIdRef = useRef(0);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(globalFilter.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [globalFilter]);

  const buildParams = (extra: Record<string, any> = {}) => {
    const params: Record<string, any> = { ...extra };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filterTerms) params.terms = filterTerms;
    return params;
  };

  const fetchPage = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setFetching(true);
    setLoading(true);
    try {
      const res: any = await Get("pos/purchse-items/", {
        ...buildParams({ page, page_size: pageSize }),
      });
      if (reqId !== reqIdRef.current) return;
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.results)
          ? body.results
          : [];
      setRecords(rows.map(mapRow));
      setTotalCount(Number(body?.count ?? rows.length));
      setOverallTotal(Number(body?.overall_total ?? 0));
    } catch (err: any) {
      if (reqId !== reqIdRef.current) return;
      if (err?.response?.status === 404 && page > 1) {
        setPage(1);
        return;
      }
      toast.error("Failed to load purchase records.");
      setRecords([]);
      setTotalCount(0);
      setOverallTotal(0);
    } finally {
      if (reqId === reqIdRef.current) {
        setFetching(false);
        setLoading(false);
      }
    }
  }, [page, pageSize, debouncedSearch, filterTerms]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const displayedTotals = useMemo(() => ({
    totalBasic: round2(records.reduce((s, r) => s + r.totalBasic, 0)),
    totalTax: round2(records.reduce((s, r) => s + r.totalTax, 0)),
    for_: round2(records.reduce((s, r) => s + r.for_, 0)),
    grandTotal: round2(records.reduce((s, r) => s + r.grandTotal, 0)),
  }), [records]);

  const hasActiveFilters = !!filterTerms;

  const handleExport = async () => {
    if (exporting) return;
    if (totalCount === 0) {
      toast.warning("No data to export.");
      return;
    }
    setExporting(true);
    try {
      let all: PurchaseRecord[] = [];
      let nextPage = 1;
      while (true) {
        const res: any = await Get("pos/purchse-items/", {
          ...buildParams({ page: nextPage, page_size: 500 }),
        });
        const body = res?.data ?? res;
        const rows: any[] = Array.isArray(body) ? body : body?.results ?? [];
        all = [...all, ...rows.map(mapRow)];
        const hasNext = Array.isArray(body) ? false : !!body?.next;
        if (!hasNext) break;
        nextPage += 1;
      }

      if (all.length === 0) {
        toast.error("No data to export.");
        return;
      }

      const exportData: any[] = all.map((r, i) => ({
        "SR No": i + 1,
        Date: r.date,
        Terms: r.paymentTerms,
        "Party Name": r.partyName,
        "Bill No": r.billNo,
        "Purchase Bill No": r.purchaseBillNo,
        "Due Date": r.dueDate ?? "-",
        Narration: r.narration,
        "Total Basic (₹)": r.totalBasic.toFixed(2),
        "Total Tax (₹)": r.totalTax.toFixed(2),
        "F+O+R (₹)": r.for_.toFixed(2),
        "Grand Total (₹)": r.grandTotal.toFixed(2),
        "Created By": r.createdByName ?? "-",
      }));

      const grandTotal = all.reduce((s, r) => s + r.grandTotal, 0);
      exportData.push({
        "SR No": "", Date: "", Terms: "", "Party Name": "TOTAL",
        "Bill No": "", "Purchase Bill No": "", "Due Date": "", Narration: "",
        "Total Basic (₹)": "", "Total Tax (₹)": "", "F+O+R (₹)": "",
        "Grand Total (₹)": grandTotal.toFixed(2), "Created By": "",
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 6 }, { wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 15 },
        { wch: 18 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 18 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Purchase Register");
      XLSX.writeFile(wb, `Purchase_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${all.length} records.`);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<PurchaseRecord>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<PurchaseRecord, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(page - 1) * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      id: "date", accessorKey: "date", header: "Date",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "paymentTerms", accessorKey: "paymentTerms", header: "Terms",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => {
        const v = String(getValue() ?? "");
        const c = v.toLowerCase() === "cash" ? "success" : v.toLowerCase() === "credit" ? "warning" : "info";
        return <Badge color={c as any} variant="soft">{v || "—"}</Badge>;
      },
    },
    {
      id: "partyName", accessorKey: "partyName", header: "Party Name",
      cell: ({ getValue, table }: CellContext<PurchaseRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-gray-800 dark:text-dark-100">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "billNo", accessorKey: "billNo", header: "Bill No",
      cell: ({ getValue, table }: CellContext<PurchaseRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="whitespace-nowrap font-medium text-primary-600 dark:text-primary-400">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "purchaseBillNo", accessorKey: "purchaseBillNo", header: "Purchase Bill No",
      cell: ({ getValue, table }: CellContext<PurchaseRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="text-xs text-gray-600 dark:text-dark-200 whitespace-nowrap">
            <Highlight query={q}>{String(getValue() ?? "") || "—"}</Highlight>
          </span>
        );
      },
    },
    {
      id: "dueDate", accessorKey: "dueDate", header: "Due Date",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => {
        const v = getValue() as string | null;
        return (
          <span className="whitespace-nowrap text-gray-500 dark:text-dark-300">
            {v ? formatDateDDMMYYYY(v) : "—"}
          </span>
        );
      },
    },
    {
      id: "narration", accessorKey: "narration", header: "Narration",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="block max-w-[120px] truncate text-gray-500 dark:text-dark-300">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
    {
      id: "totalBasic", accessorKey: "totalBasic", header: "Total Basic",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="tabular-nums font-medium text-gray-700 dark:text-dark-200">
          ₹{round2(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "totalTax", accessorKey: "totalTax", header: "Total Tax",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="tabular-nums font-medium text-amber-600 dark:text-amber-400">
          ₹{round2(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "for_", accessorKey: "for_", header: "F+O+R",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="tabular-nums text-gray-500 dark:text-dark-300">
          ₹{round2(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "grandTotal", accessorKey: "grandTotal", header: "Grand Total",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="font-bold tabular-nums text-primary-600 dark:text-primary-400">
          ₹{round2(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "createdByName", accessorKey: "createdByName", header: "Created By",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
    {
      id: "items", header: "Items", size: 80, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<PurchaseRecord, unknown>) => (
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-medium text-gray-700 dark:text-dark-200">
            {row.original.items.length}
          </span>
          <Button isIcon variant="flat" className="size-7 rounded-full"
            onClick={() => setSelectedRecord(row.original)} title="View Items">
            <EyeIcon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ], [page, pageSize]);

  const table = useReactTable({
    data: records,
    columns,
    state: { globalFilter, sorting, rowSelection },
    enableRowSelection: true,
    getRowId: row => String(row.id),
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
  });

  return (
    <Page title="Purchase Entry">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">Purchase Entry</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Showing <span className="font-semibold text-gray-800 dark:text-dark-100">{records.length}</span>{" "}
              of <span className="font-semibold">{totalCount}</span> records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              className={clsx("h-9 gap-2 rounded-md px-3 text-sm",
                showFilter && "border-primary text-primary")}
              onClick={() => setShowFilter((v) => !v)}
            >
              <FunnelIcon className={clsx("size-4", showFilter && "text-primary")} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  1
                </span>
              )}
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={handleExport} disabled={exporting}>
              <ArrowDownTrayIcon className="size-4 text-success-600" />
              <span>{exporting ? "Exporting..." : "Export Excel"}</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={fetchPage} disabled={fetching}>
              <ArrowPathIcon className={clsx("size-4", fetching && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            {canAdd && (
              <Button color="primary" className="h-9 gap-2 rounded-md px-4 text-sm"
                onClick={() => navigate("/purchases")}>
                <PlusIcon className="size-4" />
                <span>Add Purchase</span>
              </Button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="px-(--margin-x) mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Basic", value: displayedTotals.totalBasic, bg: "from-primary-500 to-primary-700", Icon: ShoppingBagIcon },
            { label: "Total Tax", value: displayedTotals.totalTax, bg: "from-amber-500 to-amber-600", Icon: ReceiptRefundIcon },
            { label: "F + O + R", value: displayedTotals.for_, bg: "from-purple-500 to-purple-700", Icon: CurrencyRupeeIcon },
            { label: "Grand Total", value: displayedTotals.grandTotal, bg: "from-emerald-500 to-emerald-700", Icon: BanknotesIcon },
          ].map(({ label, value, bg, Icon }) => (
            <div key={label} className={clsx("relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-md", bg)}>
              <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
              <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
                <Icon className="size-4 text-white" />
              </div>
              <p className="text-xl font-bold tabular-nums">₹{value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs font-medium text-white/80">{label} <span className="text-white/50">(page)</span></p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="px-(--margin-x) mt-4 max-w-sm">
          <Input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
            classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
            placeholder="Search Bill No, Party, Purchase Bill No…"
          />
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div className="px-(--margin-x) mt-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-600">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
                    Payment Terms
                  </label>
                  <select
                    value={filterTerms}
                    onChange={(e) => { setFilterTerms(e.target.value); setPage(1); }}
                    className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
                  >
                    <option value="">All Terms</option>
                    <option value="Credit">Credit</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <div className="sm:col-span-3">
                    <Button variant="outlined"
                      className="h-8 gap-2 rounded-md px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { setFilterTerms(""); setPage(1); }}>
                      <XMarkIcon className="size-3.5" /> Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={
            loading
              ? "Loading purchase records…"
              : debouncedSearch || hasActiveFilters
                ? "No purchase records match your search/filters."
                : "No purchase records found."
          }
        />

        {/* Pagination footer */}
        {totalCount > 0 && (
          <div className="px-(--margin-x) mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-300">
              <span>
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>{" "}
                – <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span>{" "}
                of <span className="font-medium">{totalCount}</span>
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} / page</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outlined" className="h-8 px-3 text-xs"
                disabled={page <= 1 || fetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              {Array.from({ length: Math.min(Math.max(1, totalPages), 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx("size-8 rounded-lg text-xs font-medium transition-colors",
                    p === page ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-dark-200 dark:hover:bg-dark-600")}>
                  {p}
                </button>
              ))}
              <Button variant="outlined" className="h-8 px-3 text-xs"
                disabled={page >= totalPages || fetching}
                onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Overall total row */}
        {totalCount > 0 && (
          <div className="px-(--margin-x) mt-2 flex flex-wrap items-center justify-end gap-6 text-xs text-gray-500 dark:text-dark-300">
            <span>
              Current page total:{" "}
              <span className="font-bold text-primary-600">₹{displayedTotals.grandTotal.toFixed(2)}</span>
            </span>
            {totalCount > pageSize && (
              <span>
                Grand total ({totalCount} records):{" "}
                <span className="font-bold text-success-600">₹{overallTotal.toFixed(2)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <ItemsDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </Page>
  );
}