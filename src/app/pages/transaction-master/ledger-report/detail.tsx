import {
  getCoreRowModel, getPaginationRowModel, getSortedRowModel,
  SortingState, useReactTable, ColumnDef, CellContext,
} from "@tanstack/react-table";
import {
  ArrowLeftIcon, ArrowPathIcon, BanknotesIcon,
  CalendarDaysIcon, CurrencyRupeeIcon, UserCircleIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Card } from "@/components/ui";
import { DatePicker } from "@/components/shared/form/DatePicker";
import { Get, toasterrormsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { usePermission } from "@/hooks/usePermissions";
import { useAuthContext } from "@/app/contexts/auth/context";


// ── Local types (backend response format) ──
interface Branch { id: number; branch_name: string; }

interface LedgerEntry {
  date: string | null;
  voucher: string | null;
  type: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  balance_dr_cr: string;
}

interface LedgerDetail {
  account_id: number;
  account: string;
  group: string;
  opening_balance: number;
  opening_dr_cr: string;
  total_debit: number;
  total_credit: number;
  closing_balance: number;
  closing_dr_cr: string;
  ledger: LedgerEntry[];
}



const getDrCrColor = (drcr: string) =>
  drcr === "Dr" ? "text-emerald-600" : "text-red-600";

export default function LedgerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const branchIdFromUrl = searchParams.get("branch_id") || "";
  const { canView } = usePermission("/ledger-report");
  const { user } = useAuthContext();
  
  const role = (user as any)?.role;
  const isSuperAdmin = role === "superadmin";
  const isEmployee = role === "employee";
  const canViewAllBranches = isSuperAdmin || isEmployee;

  const [detail, setDetail] = useState<LedgerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchIdFromUrl);

  const fetchDetail = useCallback(async (branchId: string = selectedBranchId) => {
    if (!id) return;
    setLoading(true);
    try {
      // ✅ FIX: Backend `ledger-history` sirf `date_from`/`date_to` support karta hai.
      // `branch_id` bhejna optional hai (backend ignore karega, par harm nahi).
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (branchId) params.branch_id = branchId;   // harmless if ignored

      const res = await Get(`pos/ledger-history/${id}/`, params) as any;
      // ✅ Get() returns AxiosResponse, so res.data is the actual JSON
      const body = res?.data ?? res;

      // Backend returns: { account_id, account, group, opening_balance, ..., ledger: [...] }
      if (body && typeof body === "object" && (body.account_id !== undefined || body.account !== undefined)) {
        setDetail({
          account_id: Number(body.account_id ?? 0),
          account: String(body.account ?? ""),
          group: String(body.group ?? ""),
          opening_balance: Number(body.opening_balance ?? 0),
          opening_dr_cr: String(body.opening_dr_cr ?? "Dr"),
          total_debit: Number(body.total_debit ?? 0),
          total_credit: Number(body.total_credit ?? 0),
          closing_balance: Number(body.closing_balance ?? 0),
          closing_dr_cr: String(body.closing_dr_cr ?? "Dr"),
          ledger: Array.isArray(body.ledger)
            ? body.ledger.map((row: any) => ({
                date: row.date ?? null,
                voucher: row.voucher ?? null,
                type: String(row.type ?? ""),
                particulars: String(row.particulars ?? ""),
                debit: Number(row.debit ?? 0),
                credit: Number(row.credit ?? 0),
                balance: Number(row.balance ?? 0),
                balance_dr_cr: String(row.balance_dr_cr ?? "Dr"),
              }))
            : [],
        });
      } else {
        setDetail(null);
      }
    } catch (e: any) {
      console.error("[LedgerDetail] Fetch failed:", e);
      toasterrormsg(
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        "Failed to load ledger history."
      );
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, dateFrom, dateTo, selectedBranchId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // ✅ Fetch branches list (superadmin/employee only)
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

  // ✅ Sync branch selection into URL query
  useEffect(() => {
    if (selectedBranchId) {
      searchParams.set("branch_id", selectedBranchId);
    } else {
      searchParams.delete("branch_id");
    }
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId]);

  const handleBranchChange = (val: string) => {
    setSelectedBranchId(val);
    fetchDetail(val);
  };

  const columns = useMemo<ColumnDef<LedgerEntry>[]>(() => [
    {
      id: "srNo", header: "#", size: 55, enableSorting: false,
      cell: ({ row }: CellContext<LedgerEntry, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">{row.index + 1}</span>
      ),
    },
    {
      id: "date", accessorKey: "date", header: "Date",
      cell: ({ getValue }: CellContext<LedgerEntry, unknown>) => {
        const v = String(getValue() ?? "");
        return (
          <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
            {v ? formatDateDDMMYYYY(v) : "—"}
          </span>
        );
      },
    },
    {
      id: "voucher", accessorKey: "voucher", header: "Voucher",
      cell: ({ getValue }: CellContext<LedgerEntry, unknown>) => (
        <span className="text-xs text-primary-600 dark:text-primary-400">
          {String(getValue() ?? "—") || "—"}
        </span>
      ),
    },
    {
      id: "type", accessorKey: "type", header: "Type",
      cell: ({ getValue }: CellContext<LedgerEntry, unknown>) => (
        <Badge color="info" variant="soft" className="capitalize">
          {String(getValue() ?? "—") || "—"}
        </Badge>
      ),
    },
    {
      id: "particulars", accessorKey: "particulars", header: "Particulars",
      cell: ({ getValue }: CellContext<LedgerEntry, unknown>) => (
        <span className="text-gray-700 dark:text-dark-200">
          {String(getValue() ?? "") || "—"}
        </span>
      ),
    },
    {
      id: "debit", accessorKey: "debit", header: "Debit",
      cell: ({ getValue }: CellContext<LedgerEntry, unknown>) => {
        const v = Number(getValue() ?? 0);
        return (
          <span className={clsx("tabular-nums font-medium", v > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400")}>
            {v > 0 ? `₹${v.toFixed(2)}` : "—"}
          </span>
        );
      },
    },
    {
      id: "credit", accessorKey: "credit", header: "Credit",
      cell: ({ getValue }: CellContext<LedgerEntry, unknown>) => {
        const v = Number(getValue() ?? 0);
        return (
          <span className={clsx("tabular-nums font-medium", v > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400")}>
            {v > 0 ? `₹${v.toFixed(2)}` : "—"}
          </span>
        );
      },
    },
    {
      id: "balance", accessorKey: "balance", header: "Balance",
      cell: ({ row }: CellContext<LedgerEntry, unknown>) => (
        <span className={clsx("tabular-nums font-bold", getDrCrColor(row.original.balance_dr_cr))}>
          ₹{Number(row.original.balance ?? 0).toFixed(2)}{" "}
          <span className="text-xs">{row.original.balance_dr_cr}</span>
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: detail?.ledger ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <Page title="Ledger Detail">
      <div className="transition-content w-full px-(--margin-x) py-5 pb-10 space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outlined" className="h-8 gap-2 rounded-md px-3 text-sm"
            onClick={() => navigate(
              selectedBranchId
                ? `/ledger-report?branch_id=${selectedBranchId}`
                : "/ledger-report"
            )}>
            <ArrowLeftIcon className="size-4" /> Back to Ledger
          </Button>
          {detail && (
            <>
              <div className="h-5 w-px bg-gray-300 dark:bg-dark-500" />
              <h1 className="text-lg font-bold text-gray-800 dark:text-dark-50">{detail.account}</h1>
              <Badge color="primary" variant="soft">{detail.group}</Badge>
            </>
          )}
          <div className="ml-auto flex items-center gap-2">
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
            <Button variant="outlined" className="h-9 gap-2 px-3 text-sm"
              onClick={() => fetchDetail()} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {loading && !detail && (
          <Card className="p-10 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-dark-300">Loading ledger...</p>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !detail && (
          <Card className="p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-dark-300">
              Failed to load ledger. Check browser console for details.
            </p>
          </Card>
        )}

        {/* Summary cards */}
        {detail && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Opening Balance",
                value: `₹${Number(detail.opening_balance).toLocaleString()}`,
                sub: detail.opening_dr_cr,
                bg: "bg-gradient-to-br from-primary-500 to-primary-700",
                Icon: UserCircleIcon,
              },
              {
                label: "Total Debit",
                value: `₹${Number(detail.total_debit).toLocaleString()}`,
                sub: "Dr",
                bg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
                Icon: CurrencyRupeeIcon,
              },
              {
                label: "Total Credit",
                value: `₹${Number(detail.total_credit).toLocaleString()}`,
                sub: "Cr",
                bg: "bg-gradient-to-br from-red-500 to-red-700",
                Icon: BanknotesIcon,
              },
              {
                label: "Closing Balance",
                value: `₹${Number(detail.closing_balance).toLocaleString()}`,
                sub: detail.closing_dr_cr,
                bg: detail.closing_dr_cr === "Dr"
                  ? "bg-gradient-to-br from-amber-500 to-amber-600"
                  : "bg-gradient-to-br from-rose-500 to-rose-700",
                Icon: CalendarDaysIcon,
              },
            ].map(({ label, value, sub, bg, Icon }) => (
              <div key={label} className={clsx("relative overflow-hidden rounded-xl p-4 text-white shadow-md", bg)}>
                <div className="pointer-events-none absolute -right-2 -top-2 size-12 rounded-full bg-white/10" />
                <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
                  <Icon className="size-4 text-white" />
                </div>
                <p className="text-xl font-bold tabular-nums">{value}</p>
                <p className="mt-0.5 text-xs font-semibold text-white/90">{sub}</p>
                <p className="text-xs text-white/70">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Date range filter */}
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px]">
              <DatePicker
                label="From Date"
                value={dateFrom}
                onChange={(v: any) => setDateFrom(v || "")}
                maxDate={dateTo || undefined}
              />
            </div>
            <div className="min-w-[180px]">
              <DatePicker
                label="To Date"
                value={dateTo}
                onChange={(v: any) => setDateTo(v || "")}
                minDate={dateFrom || undefined}
              />
            </div>
            <Button color="primary" className="h-9 gap-2 px-4 text-sm" onClick={() => fetchDetail()} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              Apply Filter
            </Button>
            {(dateFrom || dateTo) && (
              <Button variant="outlined" className="h-9 px-4 text-sm"
                onClick={() => { setDateFrom(""); setDateTo(""); }}>
                Clear
              </Button>
            )}
            {detail && (
              <p className="ml-auto text-sm text-gray-500 dark:text-dark-300">
                <span className="font-semibold text-gray-800 dark:text-dark-100">{detail.ledger.length}</span> transactions
              </p>
            )}
          </div>
        </Card>

        {/* Ledger table */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={loading ? "Loading ledger..." : "No ledger entries found for this period."}
        />
      </div>
    </Page>
  );
}