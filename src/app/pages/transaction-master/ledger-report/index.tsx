import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import { WithIcon, type TabItem } from "@/components/ui/Tab";
import {
  ArrowDownTrayIcon, ArrowPathIcon, EyeIcon, MagnifyingGlassIcon,
  HomeIcon, UserGroupIcon, BuildingOfficeIcon, BuildingLibraryIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Input } from "@/components/ui";
import { Get, toasterrormsg } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import { usePermission } from "@/hooks/usePermissions";
import { useAuthContext } from "@/app/contexts/auth/context";
import { LedgerAccount, GROUP_TABS, getDrCrColor, mapApiLedgerAccount } from "./data";

// ✅ ADD: branch dropdown option
interface Branch {
  id: number;
  branch_name: string;
}

export default function LedgerReportPage() {
  const navigate = useNavigate();
  const { canView } = usePermission("/ledger-report");

  // ✅ ADD: same role-gating as OutstandingReport — superadmin AND employee
  const { user } = useAuthContext();
  const role = (user as any)?.role;
  const isSuperAdmin = role === "superadmin";
  const isEmployee = role === "employee";
  const canViewAllBranches = isSuperAdmin || isEmployee;

  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [activeGroup, setActiveGroup] = useState("all");
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ ADD: branch list + currently selected branch
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // ✅ CHANGED: accepts branchId and forwards it to the API as `branch_id`
  const fetchAccounts = useCallback(async (
    pg: number,
    ps: number,
    branchId: string = selectedBranchId,
  ) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: pg, page_size: ps };
      if (branchId) params.branch_id = branchId;

      const res = await Get("pos/ledger-report/", params) as any;
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body?.results) ? body.results : [];
      setAccounts(rows.map(mapApiLedgerAccount));
      setTotal(body?.count ?? rows.length);
      setTotalPages(Math.ceil((body?.count ?? rows.length) / ps) || 1);
    } catch {
      toasterrormsg("Failed to fetch ledger accounts.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => { fetchAccounts(page, pageSize); }, [fetchAccounts, page, pageSize]);

  // ✅ ADD: fetch branch list — only for superadmin/employee
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

  // ✅ ADD: branch change handler — refetch + reset page
  const handleBranchChange = (val: string) => {
    setSelectedBranchId(val);
    setPage(1);
    fetchAccounts(1, pageSize, val);
  };

  const filteredByGroup = useMemo(() => {
    if (activeGroup === "all") return accounts;
    return accounts.filter(a => a.group === activeGroup);
  }, [accounts, activeGroup]);

  const handleExport = () => {
    const headers = ["#", "Account Name", "Group", "City", "State", "Opening Balance", "Dr/Cr", "Current Balance", "Dr/Cr"];
    const rows = filteredByGroup.map((a, i) => [
      i + 1, a.accountName, a.group, a.city || "—", a.state || "—",
      a.openingBalance, a.drcr, a.currentBalance, a.currentDrcr,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ledger_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<LedgerAccount>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<LedgerAccount, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">{row.index + 1}</span>
      ),
    },
    {
      id: "accountName", accessorKey: "accountName", header: "Account Name",
      cell: ({ getValue, table }: CellContext<LedgerAccount, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="font-semibold text-gray-800 dark:text-dark-100">
            <Highlight query={q}>{String(getValue() ?? "")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "group", accessorKey: "group", header: "Group",
      cell: ({ getValue }: CellContext<LedgerAccount, unknown>) => {
        const v = String(getValue() ?? "");
        const colorMap: Record<string, any> = {
          "Customer": "success",
          "Sundry Creditor(Main)": "warning",
          "Bank Account": "info",
          "Case In Hand": "primary",
        };
        return <Badge color={colorMap[v] ?? "neutral"} variant="soft">{v || "—"}</Badge>;
      },
    },
    {
      id: "city", accessorKey: "city", header: "City",
      cell: ({ getValue }: CellContext<LedgerAccount, unknown>) => (
        <span className="text-gray-600 dark:text-dark-200">{String(getValue() ?? "") || "—"}</span>
      ),
    },
    {
      id: "state", accessorKey: "state", header: "State",
      cell: ({ getValue }: CellContext<LedgerAccount, unknown>) => (
        <span className="text-gray-600 dark:text-dark-200">{String(getValue() ?? "") || "—"}</span>
      ),
    },
    {
      id: "openingBalance", accessorKey: "openingBalance", header: "Opening Balance",
      cell: ({ row }: CellContext<LedgerAccount, unknown>) => (
        <span className="tabular-nums font-medium text-gray-700 dark:text-dark-200">
          ₹{row.original.openingBalance}{" "}
          <span className={clsx("text-xs font-bold", getDrCrColor(row.original.drcr))}>
            {row.original.drcr}
          </span>
        </span>
      ),
    },
    {
      id: "currentBalance", accessorKey: "currentBalance", header: "Current Balance",
      cell: ({ row }: CellContext<LedgerAccount, unknown>) => (
        <span className="tabular-nums font-semibold text-gray-800 dark:text-dark-100">
          ₹{row.original.currentBalance}{" "}
          <span className={clsx("text-xs font-bold", getDrCrColor(row.original.currentDrcr))}>
            {row.original.currentDrcr}
          </span>
        </span>
      ),
    },
    {
      id: "actions", header: "Action", size: 60, enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<LedgerAccount, unknown>) => (
        <div className="flex justify-center">
          {/* ✅ CHANGED: pass branch context via URL query */}
          <Button isIcon variant="flat" className="size-8 rounded-full"
            onClick={() => navigate(
              selectedBranchId
                ? `/ledger-detail/${row.original.id}?branch_id=${selectedBranchId}`
                : `/ledger-detail/${row.original.id}`
            )}
            title="View Ledger">
            <EyeIcon className="size-4" />
          </Button>
        </div>
      ),
    },
  ], [navigate, selectedBranchId]);

  const table = useReactTable({
    data: filteredByGroup,
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
    initialState: { pagination: { pageSize } },
  });

  return (
    <Page title="Ledger / Accounts Report">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Ledger / Accounts Report
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              {table.getFilteredRowModel().rows.length} account{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* ✅ ADD: Branch filter — only for superadmin/employee */}
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
                  <option value="">My Branch (Main)</option>
                  {branches.map(b => (
                    <option key={b.id} value={String(b.id)}>{b.branch_name}</option>
                  ))}
                </select>
              </div>
            )}
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={handleExport}>
              <ArrowDownTrayIcon className="size-4 text-success-600" />
              <span>Export Excel</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={() => fetchAccounts(page, pageSize)} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Group tabs + page size in one row */}
        <div className="px-(--margin-x) mt-2 flex flex-wrap items-center justify-between gap-3">
          <WithIcon
            tabs={GROUP_TABS.map(tab => {
              const getIcon = () => {
                switch(tab.key) {
                  case "all": return HomeIcon;
                  case "Customer": return UserGroupIcon;
                  case "Sundry Creditor(Main)": return BuildingOfficeIcon;
                  case "Bank Account": return BuildingLibraryIcon;
                  case "Case In Hand": return CurrencyDollarIcon;
                  default: return HomeIcon;
                }
              };

              return {
                id: tab.key,
                title: tab.label,
                icon: getIcon(),
                content: null,
              };
            })}
            selectedIndex={GROUP_TABS.findIndex(t => t.key === activeGroup)}
            onChange={(idx) => setActiveGroup(GROUP_TABS[idx].key)}
            hidePanels={true}
          />
        </div>

        {/* Search */}
        <div className="px-(--margin-x) mt-3 max-w-sm">
          <Input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
            classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
            placeholder="Search account name, city, state..." />
        </div>

        {/* Table */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={loading ? "Loading accounts..." : "No accounts found."}
        />

        {/* Server pagination */}
        {totalPages > 1 && (
          <div className="px-(--margin-x) mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-dark-300">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outlined" className="h-8 px-3 text-xs"
                disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
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