// src/app/pages/branch/orders/index.tsx
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import { WithIcon } from "@/components/ui/Tab";
import {
  ArchiveBoxIcon, ArrowPathIcon, CheckCircleIcon, ClockIcon,
  CubeIcon, ExclamationCircleIcon, EyeIcon, MagnifyingGlassIcon,
  ShoppingBagIcon, TruckIcon, XCircleIcon, ArrowUturnLeftIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ComponentType, type SVGProps,
} from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { usePermission } from "@/hooks/usePermissions";
import { Button, Input, Select } from "@/components/ui";
import { Get, toasterrormsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import {
  Order, OrderStats, OrderStatus, BranchOption,
  STATUS_TABS, STATS_CONFIG, STATUS_MAP, getStatusBadge, mapApiOrder,
} from "./data";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
const STAT_ICONS: Icon[] = [
  ShoppingBagIcon, ClockIcon, CheckCircleIcon, CubeIcon,
  TruckIcon, ArchiveBoxIcon, XCircleIcon, ArrowUturnLeftIcon, ExclamationCircleIcon,
];
const DEFAULT_STATS: OrderStats = {
  total: 0, pending: 0, confirmed: 0, packaging: 0,
  out_for_delivery: 0, delivered: 0, cancelled: 0, returned: 0, failed: 0,
};
const PAGE_SIZE = 10;

export default function BranchOrdersPage() {
  const navigate = useNavigate();
  const isSuperAdmin = useMemo(() => localStorage.getItem("role") === "superadmin", []);
  const isEmployee   = useMemo(() => localStorage.getItem("role") === "employee", []);
  const canViewAllBranches = isSuperAdmin || isEmployee;

  const { canView } = usePermission("/Orders");

  const [stats, setStats] = useState<OrderStats>(DEFAULT_STATS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeStatus, setActiveStatus] = useState<OrderStatus>("all");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Branch dropdown state
  const [branchOpts, setBranchOpts] = useState<BranchOption[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchOption | null>(null);

  // Debounce for search
  const searchTimeoutRef = useRef<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ✅ Fetch branches (superadmin + employee)
  useEffect(() => {
    if (!canViewAllBranches) return;
    Get("branches/")
      .then((res: any) => {
        const body = res?.data ?? res;
        let rows: any[] = [];
        if (Array.isArray(body?.data)) rows = body.data;
        else if (Array.isArray(body)) rows = body;
        setBranchOpts(
          rows.map((b: any) => ({
            id: String(b.id),
            label: String(b.branch_name ?? b.name ?? `Branch ${b.id}`),
          }))
        );
      })
      .catch(err => console.error("Branches fetch failed:", err));
  }, [canViewAllBranches]);

  // ✅ Debounce globalFilter → debouncedSearch (500ms)
  useEffect(() => {
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = window.setTimeout(() => {
      setDebouncedSearch(globalFilter);
      setPage(1);
    }, 500);
    return () => {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    };
  }, [globalFilter]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params: any = {};
      if (selectedBranch?.id) params.branch_id = selectedBranch.id;
      const res = await Get("pos/branch/orders/stats/", params) as any;
      const d = res?.data ?? res;
      setStats({ ...DEFAULT_STATS, ...(d?.data ?? d) });
    } catch { /* silent */ } finally { setStatsLoading(false); }
  }, [selectedBranch]);

  const fetchOrders = useCallback(async (status: OrderStatus, pg: number, search: string) => {
    setLoading(true);
    try {
      // ✅ Map tab key → backend status
      let statusParam: string = status === "all" ? "all" : status;
      if (STATUS_MAP[statusParam]) statusParam = STATUS_MAP[statusParam];

      const params: any = { status: statusParam, page: pg, page_size: PAGE_SIZE };
      if (selectedBranch?.id) params.branch_id = selectedBranch.id;
      if (search) params.search = search;

      const res = await Get("pos/branch/orders/", params) as any;
      const body = res?.data ?? res;
      const rows: any[] = body?.data?.orders ?? body?.orders ?? [];
      const pag = body?.data?.pagination ?? body?.pagination ?? {};
      setOrders(rows.map(mapApiOrder));
      setTotalCount(pag.total ?? rows.length);
      setTotalPages(pag.total_pages ?? 1);
    } catch { toasterrormsg("Failed to fetch orders."); }
    finally { setLoading(false); }
  }, [selectedBranch]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchOrders(activeStatus, page, debouncedSearch); }, [fetchOrders, activeStatus, page, debouncedSearch]);

const handleBranchChange = (id: string) => {
  const opt = branchOpts.find(b => b.id === String(id)) ?? null;
  setSelectedBranch(opt);
  setPage(1);
};

  const handleTabChange = (status: OrderStatus) => { setActiveStatus(status); setPage(1); };

  const columns = useMemo<ColumnDef<Order>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<Order, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(page - 1) * PAGE_SIZE + row.index + 1}
        </span>
      ),
    },
    {
      id: "orderId", accessorKey: "orderId", header: "Order ID",
      cell: ({ getValue, table }: CellContext<Order, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-primary-600 dark:text-primary-400 whitespace-nowrap">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "orderDate", accessorKey: "orderDate", header: "Order Date",
      cell: ({ getValue }: CellContext<Order, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "customer", accessorKey: "customer", header: "Customer",
      cell: ({ row, getValue, table }: CellContext<Order, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        const phone = row.original.customerPhone;
        return (
          <div>
            <div className="font-medium text-gray-800 dark:text-dark-100">
              <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
            </div>
            {phone && (
              <div className="text-xs text-gray-500 dark:text-dark-300">{phone}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "totalAmount", accessorKey: "totalAmount", header: "Total Amount",
      cell: ({ row, getValue }: CellContext<Order, unknown>) => {
        const ps = row.original.paymentStatus;
        const isPaid = ps?.toLowerCase() === "completed" || ps?.toLowerCase() === "paid";
        return (
          <div className="flex flex-col">
            <span className="font-semibold tabular-nums text-gray-800 dark:text-dark-100">
              ₹{String(getValue() ?? "0")}
            </span>
            <span className={clsx(
              "text-xs font-medium",
              isPaid ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300",
            )}>
              {ps || "Pending"}
            </span>
          </div>
        );
      },
    },
    {
      id: "status", accessorKey: "status", header: "Status",
      cell: ({ getValue }: CellContext<Order, unknown>) => {
        const v = String(getValue() ?? "");
        const badge = getStatusBadge(v);
        return (
          <span className={clsx(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            badge.bg, badge.color,
          )}>
            {v.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      id: "actions", header: "Action", size: 60, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<Order, unknown>) => (
        <div className="flex justify-center">
          <Button isIcon variant="flat" className="size-8 rounded-full"
            onClick={() => {
              const q = selectedBranch?.id ? `?branch_id=${selectedBranch.id}` : "";
              navigate(`/branch/orders/${row.original.id}${q}`);
            }}
            title="View Order">
            <EyeIcon className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [navigate, page, selectedBranch]);

  const table = useReactTable({
    data: orders,
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
    manualFiltering: true,
    pageCount: totalPages,
  });

  return (
    <Page title="Branch Orders">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">Branch Orders</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {canViewAllBranches && selectedBranch && (
                <span className="font-semibold text-gray-700 dark:text-dark-100">{selectedBranch.label} · </span>
              )}
              Manage and track all orders from your branch
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* ✅ Branch filter — superadmin + employee */}
{/* ✅ Branch filter — superadmin + employee */}
{canViewAllBranches && (
  <div className="flex items-center gap-2">
    <label className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-dark-300">
      <BuildingOffice2Icon className="size-3.5" /> Branch:
    </label>
    <Select
      value={selectedBranch?.id ?? ""}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleBranchChange(e.target.value)}
      classNames={{ root: "min-w-[180px]" }}
    >
      <option value="">My Branch (Main)</option>
      {branchOpts.map(b => (
        <option key={b.id} value={b.id}>{b.label}</option>
      ))}
    </Select>
  </div>
)}

            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={() => { fetchStats(); fetchOrders(activeStatus, page, debouncedSearch); }} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="px-(--margin-x) mt-2">
          <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-dark-200">Order Summary</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 xl:grid-cols-9">
            {STATS_CONFIG.map(({ key, label, cardBg, iconBg }, i) => {
              const Icon = STAT_ICONS[i] ?? ShoppingBagIcon;
              const count = statsLoading ? "—" : stats[key];
              return (
                <button key={key} onClick={() => handleTabChange(key as OrderStatus)}
                  className={clsx(
                    "group relative flex flex-col items-center gap-2 rounded-xl p-4 text-center text-white transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-[0.97]",
                    cardBg,
                    activeStatus === key ? "ring-2 ring-white/60 shadow-lg -translate-y-0.5" : "opacity-90 hover:opacity-100",
                  )}>
                  <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
                  <span className={clsx("relative z-10 grid size-9 place-items-center rounded-xl", iconBg)}>
                    <Icon className="size-4 text-white" />
                  </span>
                  <span className="relative z-10 text-2xl font-bold leading-none tabular-nums">{count}</span>
                  <span className="relative z-10 text-[11px] font-medium text-white/80 leading-tight">{label}</span>
                  {activeStatus === key && (
                    <span className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-white/70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Status tabs */}
        <div className="px-(--margin-x) mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-dark-300">
              <span className="font-semibold text-gray-800 dark:text-dark-100">{totalCount}</span> orders
            </p>
            <div className="w-64">
              <Input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
                prefix={<MagnifyingGlassIcon className="size-4" />}
                classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
                placeholder="Search orders..." />
            </div>
          </div>

          {/* Status tabs */}
          <div className="hide-scrollbar overflow-x-auto mb-0">
            <WithIcon
              tabs={STATUS_TABS.map(tab => {
                const count = stats[tab.key as keyof OrderStats] ?? 0;
                const getIcon = () => {
                  switch (tab.key) {
                    case "all": return ShoppingBagIcon;
                    case "pending": return ClockIcon;
                    case "confirmed": return CheckCircleIcon;
                    case "packaging": return CubeIcon;
                    case "out_for_delivery": return TruckIcon;
                    case "delivered": return ArchiveBoxIcon;
                    case "cancelled": return XCircleIcon;
                    case "returned": return ArrowUturnLeftIcon;
                    case "failed": return ExclamationCircleIcon;
                    default: return ShoppingBagIcon;
                  }
                };
                return {
                  id: tab.key,
                  title: `${tab.label} (${count})`,
                  icon: getIcon(),
                  content: null,
                };
              })}
              selectedIndex={STATUS_TABS.findIndex(t => t.key === activeStatus)}
              onChange={(idx) => handleTabChange(STATUS_TABS[idx].key)}
              hidePanels={true}
            />
          </div>
        </div>

        {/* MasterTable */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={loading ? "Loading orders..." : "No orders found."}
        />

        {/* Server-side pagination */}
        {totalPages > 1 && (
          <div className="px-(--margin-x) mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-dark-300">
              Page {page} of {totalPages} · {totalCount} total
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outlined" className="h-8 px-3 text-xs"
                disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx("size-8 rounded-lg text-xs font-medium transition-colors",
                    p === page ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 dark:text-dark-200 dark:hover:bg-dark-600")}>
                  {p}
                </button>
              ))}
              <Button variant="outlined" className="h-8 px-3 text-xs"
                disabled={page >= totalPages || loading} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}