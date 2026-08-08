import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowPathIcon, FunnelIcon, MagnifyingGlassIcon,
  MegaphoneIcon, PlusIcon, XMarkIcon, EyeIcon,
  PencilIcon, TrashIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Input, Select } from "@/components/ui";
import { safeGet, toasterrormsg, toastsuccessmsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import { safeDelete } from "../../master-menu/branch-master";

interface SchemeOfferItem {
  id: number;
  offer_name: string;
  start_date: string;
  end_date: string;
  availability: string;
  branches: number[];
  branch_names: string;
  amount: string;
  scheme_type: string;
  status: string;
  created_by_branch: number;
  created_by_branch_name: string;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  draft: "Draft",
  expired: "Expired",
};

const STATUS_COLOR: Record<string, "primary" | "info" | "success" | "warning" | "error" | "neutral"> = {
  active: "success",
  inactive: "neutral",
  draft: "info",
  expired: "warning",
};

const TYPE_LABEL: Record<string, string> = {
  per_month: "Per Month",
  per_day: "Per Day",
  per_year: "Per Year",
  one_time: "One Time",
  percentage: "Percentage",
  flat: "Flat",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  all: "All Branches",
  selected: "Selected Branches",
};

function extractRows(res: any): SchemeOfferItem[] {
  const body = res?.data ?? res;
  if (body?.results?.data) return body.results.data;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body)) return body;
  return [];
}

export default function SchemeOfferListPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<SchemeOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await safeGet("pos/scheme-offers/", { page: 1, page_size: 1000 }) as any;
      setRows(extractRows(res));
    } catch (e: any) {
      setRows([]);
      const status = e?.response?.status ?? 0;
      if (status >= 500) toasterrormsg("Could not load scheme offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const filtered = useMemo(() => {
    if (!statusFilter) return rows;
    return rows.filter(r => r.status === statusFilter);
  }, [rows, statusFilter]);

  const handleDelete = useCallback(async (row: SchemeOfferItem) => {
    if (!window.confirm(`Delete scheme offer "${row.offer_name}"?`)) return;
    setDeletingId(row.id);
    try {
      await safeDelete(`pos/scheme-offers/${row.id}/`);
      toastsuccessmsg("Scheme offer deleted");
      setRows(prev => prev.filter(r => r.id !== row.id));
    } catch (e: any) {
      toasterrormsg("Could not delete scheme offer");
    } finally {
      setDeletingId(null);
    }
  }, []);

  const columns = useMemo<ColumnDef<SchemeOfferItem>[]>(() => [
    {
      id: "srNo", header: "#", size: 55,
      enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<SchemeOfferItem, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">{row.index + 1}</span>
      ),
    },
    {
      id: "offer_name", accessorKey: "offer_name", header: "Offer Name",
      cell: ({ getValue, table }: CellContext<SchemeOfferItem, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-medium text-gray-800 dark:text-dark-100">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "period", header: "Period",
      enableGlobalFilter: false, enableSorting: false,
      cell: ({ row }: CellContext<SchemeOfferItem, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200 text-xs">
          {formatDateDDMMYYYY(row.original.start_date)} - {formatDateDDMMYYYY(row.original.end_date)}
        </span>
      ),
    },
    {
      id: "availability", accessorKey: "availability", header: "Availability",
      enableGlobalFilter: false,
      cell: ({ row }: CellContext<SchemeOfferItem, unknown>) => {
        const v = row.original.availability;
        if (v === "all") {
          return (
            <Badge color="primary" variant="soft" className="whitespace-nowrap text-xs">
              All Branches
            </Badge>
          );
        }
        return (
          <div className="max-w-[220px]">
            <Badge color="info" variant="soft" className="whitespace-nowrap text-xs mb-1">
              {AVAILABILITY_LABEL[v] ?? v} ({row.original.branches?.length ?? 0})
            </Badge>
            <p className="truncate text-xs text-gray-500 dark:text-dark-400" title={row.original.branch_names}>
              {row.original.branch_names}
            </p>
          </div>
        );
      },
    },
    {
      id: "amount", accessorKey: "amount", header: "Amount",
      enableGlobalFilter: false,
      cell: ({ getValue }: CellContext<SchemeOfferItem, unknown>) => {
        const v = Number(getValue() ?? 0);
        return (
          <span className="whitespace-nowrap font-semibold text-gray-800 dark:text-dark-100">
            ₹{v.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      id: "scheme_type", accessorKey: "scheme_type", header: "Type",
      enableGlobalFilter: false,
      cell: ({ getValue }: CellContext<SchemeOfferItem, unknown>) => {
        const v = String(getValue() ?? "");
        return (
          <Badge color="neutral" variant="soft" className="whitespace-nowrap text-xs">
            {TYPE_LABEL[v] ?? (v || "—")}
          </Badge>
        );
      },
    },
    {
      id: "status", accessorKey: "status", header: "Status",
      enableGlobalFilter: false,
      cell: ({ getValue }: CellContext<SchemeOfferItem, unknown>) => {
        const v = String(getValue() ?? "");
        return (
          <Badge color={STATUS_COLOR[v] ?? "primary"} variant="soft" className="whitespace-nowrap text-xs">
            {STATUS_LABEL[v] ?? (v || "—")}
          </Badge>
        );
      },
    },
    {
      id: "actions", header: "Actions", size: 120,
      enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<SchemeOfferItem, unknown>) => (
        <div className="flex items-center gap-1.5">
          <button
            title="View"
            onClick={() => navigate(`/b2b-inventory/scheme-offer/${row.original.id}`)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors dark:text-dark-300"
          >
            <EyeIcon className="size-4" />
          </button>
          <button
            title="Edit"
            onClick={() => navigate(`/b2b-inventory/scheme-offer/${row.original.id}/edit`)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-warning/10 hover:text-warning transition-colors dark:text-dark-300"
          >
            <PencilIcon className="size-4" />
          </button>
          <button
            title="Delete"
            disabled={deletingId === row.original.id}
            onClick={() => handleDelete(row.original)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-error/10 hover:text-error transition-colors disabled:opacity-40 dark:text-dark-300"
          >
            <TrashIcon className="size-4" />
          </button>
        </div>
      ),
    },
  ], [navigate, deletingId, handleDelete]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter, sorting, rowSelection },
    enableRowSelection: true,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: fuzzyFilter,
  });

  return (
    <Page title="Scheme Offer">
      <div className="transition-content w-full pb-8">
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <MegaphoneIcon className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-dark-100">Scheme Offer</h1>
              <p className="text-xs text-gray-500 dark:text-dark-400">Manage promotional schemes and offers</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/b2b-inventory/scheme-offer/create")}
            color="primary"
            className="flex items-center gap-2"
          >
            <PlusIcon className="size-4" /> New Scheme
          </Button>
        </div>

        <div className="px-(--margin-x) flex flex-wrap gap-3 items-center mt-2">
          <div className="relative flex-1 min-w-[250px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search by offer name..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10"
            />
            {globalFilter && (
              <button onClick={() => setGlobalFilter("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="size-4" />
              </button>
            )}
          </div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="soft"
            color={showFilters || statusFilter ? "primary" : "neutral"}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="size-4" /> Filters
            {statusFilter && <Badge color="error" variant="soft" className="text-[10px]">1</Badge>}
          </Button>

          {statusFilter && (
            <Button onClick={() => { setStatusFilter(""); setShowFilters(false); }} color="error" variant="soft" className="flex items-center gap-2">
              <XMarkIcon className="size-4" /> Clear
            </Button>
          )}

          <Button onClick={fetchRows} color="neutral" variant="soft" className="flex items-center gap-2">
            <ArrowPathIcon className="size-4" /> Refresh
          </Button>
        </div>

        {showFilters && (
          <div className="px-(--margin-x) mt-3">
            <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-200 dark:border-dark-700 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  data={[
                    { label: "All Status", value: "" },
                    ...Object.entries(STATUS_LABEL).map(([k, v]) => ({ label: v, value: k })),
                  ]}
                  classNames={{ wrapper: "h-[42px]" }}
                />
              </div>
            </div>
          </div>
        )}

        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={loading ? "Loading schemes…" : "No scheme offers found"}
        />
      </div>
    </Page>
  );
}