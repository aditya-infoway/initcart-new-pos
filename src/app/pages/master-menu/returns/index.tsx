// src/app/pages/branch/returns/index.tsx
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowPathIcon, ArrowLeftIcon, ArrowUturnLeftIcon, CheckCircleIcon,
  ClockIcon, CubeIcon, ExclamationCircleIcon, MagnifyingGlassIcon,
  PhotoIcon, XCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ComponentType, type SVGProps,
} from "react";
import { useNavigate } from "react-router";
import Swal from "sweetalert2";

import { Page } from "@/components/shared/Page";
import { Button, Input } from "@/components/ui";
import { usePermission } from "@/hooks/usePermissions";
import { Get, Post, toastsuccessmsg, toasterrormsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import {
  ReturnItem, ReturnPagination, ReturnStats,
  EMPTY_STATS, PAGE_SIZES, RETURN_STAT_CARDS, getReturnStatusBadge,
  getRefundBadge, getFullImageUrl, formatReturnCurrency,
} from "./data";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
const STAT_ICONS: Icon[] = [
  ArrowUturnLeftIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon,
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "requested", label: "Requested" },
  { value: "vendor_approved", label: "Vendor Approved" },
  { value: "vendor_rejected", label: "Vendor Rejected" },
  { value: "re_requested", label: "Re-Requested" },
  { value: "admin_approved", label: "Admin Approved" },
  { value: "admin_rejected", label: "Admin Rejected" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "Online + COD" },
  { value: "razorpay", label: "Online only" },
  { value: "cod", label: "COD only" },
];

export default function BranchReturnRequestsPage() {
  const navigate = useNavigate();
  const { canEdit } = usePermission("/Orders");

  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReturnStats>(EMPTY_STATS);
  const [pagination, setPagination] = useState<ReturnPagination | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Debounced search (400ms) — matches old page
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

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize, status: statusFilter };
      if (paymentFilter !== "all") params.payment_method = paymentFilter;
      if (search) params.search = search;
      const res = await Get("pos/branch/returns/", params) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        setReturns(body.data ?? []);
        setPagination(body.pagination ?? null);
        setStats({ ...EMPTY_STATS, ...(body.stats || {}) });
      }
    } catch (err: any) {
      if (err?.response?.status === 404 && page > 1) {
        setPage(1);
        return;
      }
      toasterrormsg(err?.response?.data?.message ?? "Failed to fetch returns");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, paymentFilter, search]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const handleAction = async (item: ReturnItem, action: "approve" | "reject") => {
    const codNote =
      action === "approve" && item.payment_method === "cod"
        ? `<div style="font-size:13px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:8px;margin-bottom:8px;text-align:left">
             This is a <b>COD</b> order. After approval, the refund is paid by the platform admin directly to the customer's bank account.
           </div>`
        : "";
    const confirm = await Swal.fire({
      icon: "question",
      title: action === "approve" ? "Approve Return?" : "Reject Return?",
      html: codNote,
      input: "text",
      inputLabel: "Remarks (optional)",
      showCancelButton: true,
      confirmButtonText: action === "approve" ? "Approve" : "Reject",
      confirmButtonColor: action === "approve" ? "#16a34a" : "#dc2626",
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await Post(`pos/branch/returns/${item.id}/action/`, {
        action,
        remarks: confirm.value || "",
      }) as any;
      const body = res?.data ?? res;
      if (body?.success) {
        toastsuccessmsg(body.message ?? "Done");
        fetchReturns();
      }
    } catch (err: any) {
      toasterrormsg(err?.response?.data?.message ?? "Action failed");
      fetchReturns();
    }
  };

  const handleViewImages = (item: ReturnItem) => {
    if (!item.images || item.images.length === 0) {
      Swal.fire({ icon: "info", title: "No Images", text: "Customer did not upload any images." });
      return;
    }
    const imagesHtml = item.images
      .map((rawUrl) => {
        const url = getFullImageUrl(rawUrl);
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">
          <img src="${url}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;" />
        </a>`;
      })
      .join("");
    Swal.fire({
      title: `Images — ${item.return_id}`,
      html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">${imagesHtml}</div>`,
      width: 500,
      confirmButtonText: "Close",
      confirmButtonColor: "#2563eb",
    });
  };

  const columns = useMemo<ColumnDef<ReturnItem>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<ReturnItem, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(page - 1) * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      id: "return_id", accessorKey: "return_id", header: "Return ID",
      cell: ({ getValue, table }: CellContext<ReturnItem, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-primary-600 dark:text-primary-400 whitespace-nowrap">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "order_number", accessorKey: "order_number", header: "Order",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {String(getValue() ?? "—")}
        </span>
      ),
    },
    {
      id: "product_name", accessorKey: "product_name", header: "Product",
      cell: ({ row, getValue, table }: CellContext<ReturnItem, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        const sku = row.original.sku;
        return (
          <div>
            <div className="font-medium text-gray-800 dark:text-dark-100">
              <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
            </div>
            {sku && <div className="text-xs text-gray-500 dark:text-dark-300">SKU: {sku}</div>}
          </div>
        );
      },
    },
    {
      id: "customer_name", accessorKey: "customer_name", header: "Customer",
      cell: ({ getValue, table }: CellContext<ReturnItem, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="text-gray-700 dark:text-dark-200">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "quantity", accessorKey: "quantity", header: "Qty",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => (
        <span className="text-gray-700 dark:text-dark-200">{String(getValue() ?? 0)}</span>
      ),
    },
    {
      id: "item_total", accessorKey: "item_total", header: "Amount",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => (
        <span className="font-semibold tabular-nums text-gray-800 dark:text-dark-100">
          {formatReturnCurrency(Number(getValue() ?? 0))}
        </span>
      ),
    },
    {
      id: "payment_method", accessorKey: "payment_method", header: "Payment",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => {
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
      id: "reason", accessorKey: "reason", header: "Reason",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => (
        <span className="capitalize text-gray-600 dark:text-dark-200">
          {String(getValue() ?? "").replace(/_/g, " ")}
        </span>
      ),
    },
    {
      id: "status", accessorKey: "status", header: "Status",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => {
        const v = String(getValue() ?? "");
        const badge = getReturnStatusBadge(v);
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
      id: "refund_status", accessorKey: "refund_status", header: "Refund",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => {
        const s = getValue() as ReturnItem["refund_status"];
        if (!s) return <span className="text-xs text-gray-400">-</span>;
        const badge = getRefundBadge(s);
        return (
          <span className={clsx(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
            badge.bg, badge.color,
          )}>
            {badge.label}
          </span>
        );
      },
    },
    {
      id: "requested_at", accessorKey: "requested_at", header: "Requested On",
      cell: ({ getValue }: CellContext<ReturnItem, unknown>) => (
        <span className="whitespace-nowrap text-gray-500 dark:text-dark-300">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "actions", header: "Action", enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<ReturnItem, unknown>) => {
        const item = row.original;
        const showApproveReject = canEdit && item.status === "requested";
        return (
          <div className="flex flex-wrap gap-1.5">
            {showApproveReject && (
              <>
                <Button
                  className="h-7 rounded-md bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700"
                  onClick={() => handleAction(item, "approve")}
                >
                  Approve
                </Button>
                <Button
                  className="h-7 rounded-md bg-red-600 px-2 text-xs text-white hover:bg-red-700"
                  onClick={() => handleAction(item, "reject")}
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              className="h-7 gap-1 rounded-md px-2 text-xs"
              onClick={() => handleViewImages(item)}
            >
              <PhotoIcon className="size-3.5" />
              Images {item.images?.length > 0 ? `(${item.images.length})` : ""}
            </Button>
          </div>
        );
      },
    },
  ], [canEdit, page, pageSize]);

  const table = useReactTable({
    data: returns,
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
    <Page title="Return Requests">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Button variant="flat" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeftIcon className="size-4" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                Return Requests
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
                Approve or reject returns from your customers.
              </p>
            </div>
          </div>
          <Button
            variant="outlined"
            className="h-9 gap-2 rounded-md px-3 text-sm"
            onClick={fetchReturns}
            disabled={loading}
          >
            <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Stats cards */}
        <div className="px-(--margin-x) mt-2">
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">Summary</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {RETURN_STAT_CARDS.map(({ key, label, cardBg, iconBg }, i) => {
              const Icon = STAT_ICONS[i] ?? ArrowUturnLeftIcon;
              const filterKey = key === "total" ? "all" : key;
              const active = statusFilter === filterKey;
              const count = loading ? "—" : (stats as any)[key] ?? 0;
              return (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(filterKey); setPage(1); }}
                  className={clsx(
                    "group relative flex flex-col items-center gap-2 rounded-xl p-4 text-center text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.97]",
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
              return requests
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-72">
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  prefix={<MagnifyingGlassIcon className="size-4" />}
                  classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
                  placeholder="Search by Return ID, Order, Product, SKU, Customer…"
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
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:ring-3 ring-primary-500/50 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              >
                {PAYMENT_OPTIONS.map(o => (
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
              ? "Loading return requests..."
              : search
                ? "No return requests match your search."
                : "No return requests found."
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