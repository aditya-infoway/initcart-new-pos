// src/app/pages/sales-master/sales-return/index.tsx
import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowDownTrayIcon, ArrowPathIcon, BanknotesIcon, CubeIcon,
  EyeIcon, FunnelIcon, MagnifyingGlassIcon, PlusIcon,
  PrinterIcon, ReceiptRefundIcon, TrashIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Card, Input, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { Get, Delete, formatDateDDMMYYYY, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import { usePermission } from "@/hooks/usePermissions";
import { mapApiSalesReturn, SalesReturnRecord } from "./data";

const PAGE_SIZES = [10, 15, 25, 50, 100];

// ── Detail Drawer ─────────────────────────────────────────────────────────
function DetailDrawer({
  isOpen,
  onClose,
  rec,
}: {
  isOpen: boolean;
  onClose: () => void;
  rec: SalesReturnRecord | null;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-100" onClose={onClose}>
        <TransitionChild
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
        />
        <TransitionChild
          as={DialogPanel}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
          className="fixed top-0 right-0 flex h-full w-full lg:max-w-[65%] xl:max-w-[55%] transform-gpu flex-col bg-white dark:bg-dark-700"
        >
          <div className="bg-primary flex shrink-0 items-center justify-between border-b border-primary/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-white/20 text-white">
                <ReceiptRefundIcon className="size-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Sales Return Details — {rec?.returnNo}
                </h3>
                <p className="mt-0.5 text-sm text-white/75">
                  {rec?.customerName} · {formatDateDDMMYYYY(rec?.date ?? "")}
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

          <div className="hide-scrollbar grow space-y-4 overflow-y-auto px-5 py-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { label: "Total Items", value: rec?.items.length ?? 0, bg: "bg-gradient-to-br from-blue-500 to-blue-700", Icon: CubeIcon },
                { label: "Grand Total", value: `₹${Number(rec?.grandTotal ?? 0).toFixed(2)}`, bg: "bg-gradient-to-br from-primary-500 to-primary-700", Icon: BanknotesIcon },
                { label: "Return Type", value: rec?.returnType ?? "—", bg: "bg-gradient-to-br from-emerald-500 to-emerald-700", Icon: ReceiptRefundIcon },
              ].map(({ label, value, bg, Icon }) => (
                <div key={label} className={clsx("relative overflow-hidden rounded-xl p-4 text-white shadow-md", bg)}>
                  <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
                  <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
                    <Icon className="size-4 text-white" />
                  </div>
                  <p className="text-xl font-bold tabular-nums">{value}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/80">{label}</p>
                </div>
              ))}
            </div>

            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-600 flex items-center gap-3 bg-gray-50 dark:bg-dark-800">
                <ReceiptRefundIcon className="size-4 text-primary" />
                <h3 className="text-sm font-bold text-gray-800 dark:text-dark-50">Return Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
                {[
                  { label: "Return No", value: rec?.returnNo ?? "" },
                  { label: "Date", value: formatDateDDMMYYYY(rec?.date ?? "") },
                  { label: "Customer", value: rec?.customerName ?? "" },
                  { label: "Reason", value: rec?.reason ?? "" },
                  { label: "Return Type", value: rec?.returnType ?? "" },
                  { label: "Approved By", value: rec?.approvedBy || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-dark-500 dark:bg-dark-800">
                    <p className="text-xs text-gray-400 dark:text-dark-400">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-dark-100">{value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {(rec?.items.length ?? 0) > 0 && (
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-600 flex items-center gap-3 bg-gray-50 dark:bg-dark-800">
                  <ReceiptRefundIcon className="size-4 text-primary" />
                  <h3 className="text-sm font-bold text-gray-800 dark:text-dark-50">Returned Items</h3>
                  <Badge color="primary" variant="soft" className="text-xs font-semibold">
                    {rec?.items.length ?? 0}
                  </Badge>
                </div>
                <div className="overflow-x-auto">
                  <Table hoverable className="w-full">
                    <THead>
                      <Tr>
                        {["Item", "Qty", "Price", "Tax%", "Net Amount"].map((h) => (
                          <Th key={h} className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">
                            {h}
                          </Th>
                        ))}
                      </Tr>
                    </THead>
                    <TBody>
                      {rec?.items.map((item, i) => (
                        <Tr key={i} className="dark:border-b-dark-500 border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-dark-800">
                          <Td className="px-4 py-3 font-semibold text-gray-800 dark:text-dark-100">{item.item_name}</Td>
                          <Td className="px-4 py-3 text-center">
                            <Badge color="info" variant="soft" className="text-xs font-bold">
                              {item.return_quantity}
                            </Badge>
                          </Td>
                          <Td className="px-4 py-3 text-right text-xs font-mono font-semibold text-primary">
                            ₹{Number(item.price).toFixed(2)}
                          </Td>
                          <Td className="px-4 py-3 text-center">
                            <Badge color="warning" variant="soft" className="text-xs">
                              {item.tax_percent}%
                            </Badge>
                          </Td>
                          <Td className="px-4 py-3 text-right text-xs font-mono font-bold text-primary">
                            ₹{Number(item.net_amount).toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                      <Tr className="dark:border-b-dark-500 border-t-2 border-gray-200 dark:border-dark-500 bg-gray-50 dark:bg-dark-800">
                        <Td colSpan={4} className="px-4 py-3 text-xs font-bold uppercase text-gray-700 dark:text-dark-100">Total</Td>
                        <Td className="px-4 py-3 text-right text-xs font-mono font-bold text-primary dark:text-primary-400">
                          ₹{Number(rec?.grandTotal ?? 0).toFixed(2)}
                        </Td>
                      </Tr>
                    </TBody>
                  </Table>
                </div>
              </Card>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-500">
            <Button variant="outlined" className="gap-2" onClick={() => window.print()}>
              <PrinterIcon className="size-4" /> Print
            </Button>
            <Button variant="outlined" onClick={onClose}>Close</Button>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function SalesReturnPage() {
  const navigate = useNavigate();
  const { canAdd, canDelete, canView } = usePermission("/salesReturnList");

  const [records, setRecords] = useState<SalesReturnRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [overallTotal, setOverallTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showFilter, setShowFilter] = useState(false);
  const [filterReturnType, setFilterReturnType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [selected, setSelected] = useState<SalesReturnRecord | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const reqIdRef = useRef(0);

  // debounce search
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
    if (filterReturnType) params.return_type = filterReturnType;
    if (filterStartDate) params.date_from = filterStartDate;
    if (filterEndDate) params.date_to = filterEndDate;
    return params;
  };

  const fetchPage = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res: any = await Get("pos/sales-return-list/", {
        ...buildParams({ page, page_size: pageSize }),
      });
      if (reqId !== reqIdRef.current) return;
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.results)
          ? body.results
          : [];
      setRecords(rows.map(mapApiSalesReturn));
      setTotalCount(Number(body?.count ?? rows.length));
      setOverallTotal(Number(body?.overall_total ?? 0));
    } catch (err: any) {
      if (reqId !== reqIdRef.current) return;
      if (err?.response?.status === 404 && page > 1) {
        setPage((p) => p - 1);
        return;
      }
      toasterrormsg("Failed to load sales returns.");
      setRecords([]);
      setTotalCount(0);
      setOverallTotal(0);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, filterReturnType, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const displayedTotal = records.reduce((s, r) => s + r.grandTotal, 0);

  const hasActiveFilters =
    !!filterReturnType || !!filterStartDate || !!filterEndDate;

  const clearFilters = () => {
    setFilterReturnType("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sales return?")) return;
    try {
      await Delete(`pos/sales-return-delete/${id}/`, {});
      toastsuccessmsg("Sales return deleted successfully.");
      fetchPage();
    } catch {
      toasterrormsg("Failed to delete sales return.");
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    if (totalCount === 0) {
      toasterrormsg("No data to export.");
      return;
    }
    setExporting(true);
    try {
      let all: SalesReturnRecord[] = [];
      let nextPage = 1;
      while (true) {
        const res: any = await Get("pos/sales-return-list/", {
          ...buildParams({ page: nextPage, page_size: 500 }),
        });
        const body = res?.data ?? res;
        const rows: any[] = Array.isArray(body) ? body : body?.results ?? [];
        all = [...all, ...rows.map(mapApiSalesReturn)];
        const hasNext = Array.isArray(body) ? false : !!body?.next;
        if (!hasNext) break;
        nextPage += 1;
      }

      if (all.length === 0) {
        toasterrormsg("No data to export.");
        return;
      }

      const exportData: any[] = all.map((r, i) => ({
        "SR No": i + 1,
        "Return No": r.returnNo,
        Date: r.date,
        "Customer Name": r.customerName,
        "Reason for Return": r.reason,
        "Return Type": r.returnType,
        "Approved By": r.approvedBy,
        "Grand Total (₹)": r.grandTotal.toFixed(2),
      }));

      const grandTotal = all.reduce((s, r) => s + r.grandTotal, 0);
      exportData.push({
        "SR No": "",
        "Return No": "",
        Date: "",
        "Customer Name": "TOTAL",
        "Reason for Return": "",
        "Return Type": "",
        "Approved By": "",
        "Grand Total (₹)": grandTotal.toFixed(2),
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws["!cols"] = [
        { wch: 6 }, { wch: 18 }, { wch: 12 }, { wch: 25 },
        { wch: 30 }, { wch: 14 }, { wch: 18 }, { wch: 16 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales Return List");
      XLSX.writeFile(wb, `Sales_Return_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toastsuccessmsg(`Exported ${all.length} records.`);
    } catch {
      toasterrormsg("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const columns = useMemo<ColumnDef<SalesReturnRecord>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<SalesReturnRecord, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(page - 1) * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      id: "returnNo", accessorKey: "returnNo", header: "Return No",
      cell: ({ getValue, table }: CellContext<SalesReturnRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="whitespace-nowrap text-xs font-medium text-primary-600 dark:text-primary-400">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "date", accessorKey: "date", header: "Date",
      cell: ({ getValue }: CellContext<SalesReturnRecord, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "customerName", accessorKey: "customerName", header: "Customer",
      cell: ({ getValue, table }: CellContext<SalesReturnRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-gray-800 dark:text-dark-100">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "reason", accessorKey: "reason", header: "Reason",
      cell: ({ getValue, table }: CellContext<SalesReturnRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="block max-w-[140px] truncate text-gray-500 dark:text-dark-300">
            <Highlight query={q}>{String(getValue() ?? "") || "—"}</Highlight>
          </span>
        );
      },
    },
    {
      id: "returnType", accessorKey: "returnType", header: "Type",
      cell: ({ getValue }: CellContext<SalesReturnRecord, unknown>) => {
        const v = String(getValue() ?? "");
        return (
          <Badge
            color={v.toLowerCase() === "full" ? "success" : "warning"}
            variant="soft"
            className="text-xs capitalize"
          >
            {v || "—"}
          </Badge>
        );
      },
    },
    {
      id: "approvedBy", accessorKey: "approvedBy", header: "Approved By",
      cell: ({ getValue }: CellContext<SalesReturnRecord, unknown>) => (
        <span className="text-gray-600 dark:text-dark-200">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
    {
      id: "grandTotal", accessorKey: "grandTotal", header: "Amount",
      cell: ({ getValue }: CellContext<SalesReturnRecord, unknown>) => (
        <span className="font-bold tabular-nums text-primary-600 dark:text-primary-400">
          ₹{Number(getValue() ?? 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "createdByName", accessorKey: "createdByName", header: "Created By",
      cell: ({ getValue }: CellContext<SalesReturnRecord, unknown>) => (
        <span className="text-gray-600 dark:text-dark-200">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
    {
      id: "actions", header: "Actions", enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<SalesReturnRecord, unknown>) => (
        <div className="flex items-center gap-1.5">
          {canView && (
            <Button
              isIcon
              variant="flat"
              className="size-7 rounded-full"
              title="View"
              onClick={() => setSelected(row.original)}
            >
              <EyeIcon className="size-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              isIcon
              variant="flat"
              className="size-7 rounded-full hover:bg-error-50 dark:hover:bg-error-900/20"
              title="Delete"
              onClick={() => handleDelete(row.original.id)}
            >
              <TrashIcon className="size-3.5 text-error-600" />
            </Button>
          )}
        </div>
      ),
    },
  ], [canView, canDelete, page, pageSize]);

  const table = useReactTable({
    data: records,
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
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <Page title="Sales Return & Report">
      <div className="transition-content w-full pb-8">
        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Sales Return List
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              Showing <span className="font-semibold text-gray-800 dark:text-dark-100">
                {records.length}
              </span> of{" "}
              <span className="font-semibold">{totalCount}</span> records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              className={clsx(
                "h-9 gap-2 rounded-md px-3 text-sm",
                showFilter && "border-primary text-primary",
              )}
              onClick={() => setShowFilter((v) => !v)}
            >
              <FunnelIcon className={clsx("size-4", showFilter && "text-primary")} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {[filterReturnType, filterStartDate, filterEndDate].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button
              variant="outlined"
              className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <ArrowDownTrayIcon className="size-4 text-success-600" />
              <span>{exporting ? "Exporting..." : "Export Excel"}</span>
            </Button>
            <Button
              variant="outlined"
              className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={fetchPage}
              disabled={loading}
            >
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            {canAdd && (
              <Button
                color="primary"
                className="h-9 gap-2 rounded-md px-4 text-sm"
                onClick={() => navigate("/sales-return")}
              >
                <PlusIcon className="size-4" />
                <span>New Return</span>
              </Button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="px-(--margin-x) mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <BanknotesIcon className="size-4 text-white" />
            </div>
            <p className="text-xl font-bold tabular-nums">
              ₹{overallTotal.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs font-medium text-white/80">
              Total Return Value
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <ReceiptRefundIcon className="size-4 text-white" />
            </div>
            <p className="text-xl font-bold tabular-nums">
              {records.filter((r) => r.returnType.toLowerCase() === "full").length}
            </p>
            <p className="mt-0.5 text-xs font-medium text-white/80">
              Full Returns (this page)
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <ReceiptRefundIcon className="size-4 text-white" />
            </div>
            <p className="text-xl font-bold tabular-nums">
              {records.filter((r) => r.returnType.toLowerCase() === "partial").length}
            </p>
            <p className="mt-0.5 text-xs font-medium text-white/80">
              Partial Returns (this page)
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-(--margin-x) mt-4 max-w-sm">
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
            classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
            placeholder="Search Return No, Customer, Reason…"
          />
        </div>

        {/* Filters */}
        {showFilter && (
          <div className="px-(--margin-x) mt-3">
            <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3 dark:border-dark-500 dark:bg-dark-600">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
                  Return Type
                </label>
                <select
                  value={filterReturnType}
                  onChange={(e) => { setFilterReturnType(e.target.value); setPage(1); }}
                  className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
                >
                  <option value="">All Types</option>
                  <option value="Full">Full Return</option>
                  <option value="Partial">Partial Return</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
                  From Date
                </label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                  classNames={{ input: "h-9 text-sm" }}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
                  To Date
                </label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                  classNames={{ input: "h-9 text-sm" }}
                />
              </div>
              {hasActiveFilters && (
                <div className="sm:col-span-3">
                  <Button
                    variant="outlined"
                    className="h-8 gap-2 rounded-md px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={clearFilters}
                  >
                    <XMarkIcon className="size-3.5" /> Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={
            loading
              ? "Loading sales returns…"
              : debouncedSearch || hasActiveFilters
                ? "No sales returns match your search/filters."
                : "No sales returns found."
          }
        />

        {/* Server-side pagination footer */}
        {totalCount > 0 && (
          <div className="px-(--margin-x) mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-300">
              <span>
                Showing{" "}
                <span className="font-medium">
                  {(page - 1) * pageSize + 1}
                </span>{" "}
                –{" "}
                <span className="font-medium">
                  {Math.min(page * pageSize, totalCount)}
                </span>{" "}
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
              <Button
                variant="outlined"
                className="h-8 px-3 text-xs"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from(
                { length: Math.min(Math.max(1, totalPages), 5) },
                (_, i) => i + 1,
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={clsx(
                    "size-8 rounded-lg text-xs font-medium transition-colors",
                    p === page
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
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Current-page total / grand-total footer (mirrors old) */}
        {totalCount > 0 && (
          <div className="px-(--margin-x) mt-2 flex flex-wrap items-center justify-end gap-6 text-xs text-gray-500 dark:text-dark-300">
            <span>
              Current page total:{" "}
              <span className="font-bold text-primary-600">
                ₹{displayedTotal.toFixed(2)}
              </span>
            </span>
            {totalCount > pageSize && (
              <span>
                Grand total ({totalCount} records):{" "}
                <span className="font-bold text-success-600">
                  ₹{overallTotal.toFixed(2)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      <DetailDrawer isOpen={!!selected} onClose={() => setSelected(null)} rec={selected} />
    </Page>
  );
}