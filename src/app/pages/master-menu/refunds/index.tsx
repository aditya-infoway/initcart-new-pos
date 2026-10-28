// src/app/pages/branch/refunds/index.tsx
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowPathIcon, ArrowLeftIcon, BanknotesIcon, CheckCircleIcon,
  ClockIcon, MagnifyingGlassIcon, XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ComponentType, type SVGProps,
} from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Button, Input } from "@/components/ui";
import { Get, toasterrormsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import {
  RefundItem, RefundPagination, RefundStats,
  EMPTY_REFUND_STATS, REFUND_PAGE_SIZES, REFUND_STAT_CARDS,
  getRefundStatusBadge, formatRefundCurrency,
} from "./data";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
const STAT_ICONS: Icon[] = [BanknotesIcon, ClockIcon, CheckCircleIcon, XCircleIcon];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
  { value: "failed", label: "Failed" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Online + COD" },
  { value: "online", label: "Online only" },
  { value: "cod", label: "COD only" },
];

export default function BranchRefundListPage() {
  const navigate = useNavigate();

  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RefundStats>(EMPTY_REFUND_STATS);
  const [pagination, setPagination] = useState<RefundPagination | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Debounce (400ms) — same as old
  const searchTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput]);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize, status: statusFilter };
      if (typeFilter !== "all") params.type = typeFilter;
      if (search) params.search = search;
      const res = await Get("pos/branch/refunds/", params) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        setRefunds(body.data ?? []);
        setPagination(body.pagination ?? null);
        setStats({ ...EMPTY_REFUND_STATS, ...(body.stats || {}) });
      }
    } catch (err: any) {
      if (err?.response?.status === 404 && page > 1) {
        setPage(1);
        return;
      }
      toasterrormsg(err?.response?.data?.message ?? "Failed to fetch refunds");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter, search]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const columns = useMemo<ColumnDef<RefundItem>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<RefundItem, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(page - 1) * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      id: "refund_id", accessorKey: "refund_id", header: "Refund ID",
      cell: ({ getValue, table }: CellContext<RefundItem, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-primary-600 dark:text-primary-400 whitespace-nowrap">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "return_id", accessorKey: "return_id", header: "Return ID",
      cell: ({ getValue }: CellContext<RefundItem, unknown>) => (
        <span className="text-gray-600 dark:text-dark-200">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      id: "order_number", accessorKey: "order_number", header: "Order",
      cell: ({ getValue }: CellContext<RefundItem, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {String(getValue() ?? "—")}
        </span>
      ),
    },
    {
      id: "refund_type", accessorKey: "refund_type", header: "Type",
      cell: ({ getValue }: CellContext<RefundItem, unknown>) => {
        const v = String(getValue() ?? "");
        const isCod = v === "cod";
        return (
          <span className={clsx(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            isCod
              ? "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10"
              : "text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10",
          )}>
            {isCod ? "COD" : "Online"}
          </span>
        );
      },
    },
    {
      id: "product_name", accessorKey: "product_name", header: "Product",
      cell: ({ getValue, table }: CellContext<RefundItem, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="text-gray-700 dark:text-dark-200">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "customer_name", accessorKey: "customer_name", header: "Customer",
      cell: ({ getValue, table }: CellContext<RefundItem, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="text-gray-700 dark:text-dark-200">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "refund_amount", header: "Refund Amount",
      cell: ({ row }: CellContext<RefundItem, unknown>) => {
        const it = row.original;
        // Same logic as old: processed + paid_amount → show paid_amount else refund_amount
        const amt =
          it.status === "processed" && it.paid_amount != null
            ? it.paid_amount
            : it.refund_amount;
        return (
          <span className="font-semibold tabular-nums text-gray-800 dark:text-dark-100">
            {formatRefundCurrency(Number(amt ?? 0))}
          </span>
        );
      },
    },
    {
      id: "status", accessorKey: "status", header: "Status",
      cell: ({ getValue }: CellContext<RefundItem, unknown>) => {
        const v = String(getValue() ?? "");
        const badge = getRefundStatusBadge(v);
        return (
          <span className={clsx(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize whitespace-nowrap",
            badge.bg, badge.color,
          )}>
            {badge.label}
          </span>
        );
      },
    },
    {
      id: "processed_at", accessorKey: "processed_at", header: "Refunded On",
      cell: ({ getValue }: CellContext<RefundItem, unknown>) => {
        const v = getValue() as string | null;
        return (
          <span className="whitespace-nowrap text-gray-500 dark:text-dark-300">
            {v ? formatDateDDMMYYYY(v) : "-"}
          </span>
        );
      },
    },
  ], [page, pageSize]);

  const table = useReactTable({
    data: refunds,
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
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualFiltering: true,
    pageCount: Math.max(1, pagination?.total_pages ?? 1),
  });

  return (
    <Page title="Refunded Orders">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Button variant="flat" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeftIcon className="size-4" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Refunded Orders
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                Returned items that were refunded — they won't appear in your payment requests.
              </p>
            </div>
          </div>
          <Button
            variant="outlined"
            className="h-9 gap-2 rounded-md px-3 text-sm"
            onClick={fetchRefunds}
            disabled={loading}
          >
            <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Stats cards */}
        <div className="px-(--margin-x) mt-2">
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">Summary</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {REFUND_STAT_CARDS.map(({ key, label, amountKey, cardBg, iconBg }, i) => {
              const Icon = STAT_ICONS[i] ?? BanknotesIcon;
              const filterKey = key === "total" ? "all" : key;
              const active = statusFilter === filterKey;
              const count = loading ? "—" : (stats as any)[key] ?? 0;
              const amount = loading ? "—" : formatRefundCurrency((stats as any)[amountKey] ?? 0);
              return (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(filterKey); setPage(1); }}
                  className={clsx(
                    "group relative flex flex-col items-center gap-1.5 rounded-xl p-4 text-center text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.97]",
                    cardBg,
                    active ? "ring-2 ring-white/60 shadow-lg -translate-y-0.5" : "opacity-90 hover:opacity-100",
                  )}
                >
                  <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
                  <span className={clsx("relative z-10 grid size-9 place-items-center rounded-xl", iconBg)}>
                    <Icon className="size-4 text-white" />
                  </span>
                  <span className="relative z-10 text-2xl font-bold leading-none tabular-nums">{count}</span>
                  <span className="relative z-10 text-[11px] font-medium text-white/80 leading-tight">{label}</span>
                  <span className="relative z-10 text-[11px] font-semibold text-white/90 tabular-nums">{amount}</span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-white/70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="px-(--margin-x) mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-dark-300">
              <span className="font-semibold text-gray-800 dark:text-dark-100">
                {pagination?.count ?? 0}
              </span>{" "}
              refunds
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-80">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  prefix={<MagnifyingGlassIcon className="size-4" />}
                  classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
                  placeholder="Search by Refund ID, Return ID, Order, Product, Customer…"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:ring-3 ring-primary-500/50 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              >
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:ring-3 ring-primary-500/50 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={
            loading
              ? "Loading refunds..."
              : search
                ? "No refunds match your search."
                : "No refunds yet."
          }
        />

        {/* Server-side pagination */}
        {pagination && pagination.count > 0 && (
          <div className="px-(--margin-x) mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-300">
              <span>
                Showing{" "}
                <span className="font-medium">
                  {(pagination.current_page - 1) * pagination.page_size + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.current_page * pagination.page_size,
                    pagination.count,
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.count}</span>
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              >
                {REFUND_PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} / page</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outlined"
                className="h-8 px-3 text-xs"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {Array.from(
                { length: Math.min(Math.max(1, pagination.total_pages), 5) },
                (_, i) => i + 1,
              ).map(p => (
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
                disabled={page >= Math.max(1, pagination.total_pages) || loading}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}