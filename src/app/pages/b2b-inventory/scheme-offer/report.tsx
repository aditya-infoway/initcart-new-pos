import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CubeIcon,
  DocumentArrowDownIcon,
  PhoneIcon,
  PrinterIcon,
  TagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Card, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { Get, formatDateDDMMYYYY, toasterrormsg } from "@/ApiHelper";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CustomerRow {
  customer_id: number;
  customer_name: string;
  customer_phone?: string;
  total_sales: number;
}

interface BranchReport {
  branch_id: number;
  branch_name: string;
  customers: CustomerRow[];
}

interface MonthReport {
  year: number;
  month: number;
  label: string;
  period_start: string;
  period_end: string;
  branches: BranchReport[];
}

interface SchemeReport {
  scheme_id: number;
  offer_name: string;
  amount: number;
  scheme_type: string;
  status: string;
  start_date: string;
  end_date: string;
  months: MonthReport[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, "success" | "neutral" | "warning" | "info"> = {
  active: "success",
  inactive: "neutral",
  expired: "warning",
  draft: "info",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  draft: "Draft",
};

const TYPE_LABEL: Record<string, string> = {
  per_month: "Per Month",
  per_day: "Per Day",
  per_year: "Per Year",
  one_time: "One Time",
  percentage: "Percentage",
  flat: "Flat",
};

// ─── Month Accordion ────────────────────────────────────────────────────────

function MonthAccordion({
  month,
  isOpen,
  onToggle,
}: {
  month: MonthReport;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const totalCustomers = month.branches?.reduce((s, b) => s + b.customers.length, 0) || 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750">
      {/* Accordion header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
      >
        <span className="font-semibold text-gray-800 dark:text-dark-100">{month.label}</span>
        <span className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-400">
          {totalCustomers > 0 ? (
            <Badge color="primary" variant="soft" className="text-xs">
              {totalCustomers} customer{totalCustomers > 1 ? "s" : ""} qualified
            </Badge>
          ) : (
            <span className="text-gray-400 dark:text-dark-500 text-xs">No customers qualified</span>
          )}
          {isOpen
            ? <ChevronUpIcon className="size-4" />
            : <ChevronDownIcon className="size-4" />}
        </span>
      </button>

      {/* Accordion body */}
      {isOpen && (
        <div className="border-t border-gray-100 dark:border-dark-600 px-5 pb-5 pt-4 space-y-4">
          {!month.branches?.length ? (
            <p className="text-center text-sm text-gray-400 dark:text-dark-500 py-6 italic">
              No customer crossed the threshold this month.
            </p>
          ) : month.branches.map((branch) => (
            <div key={branch.branch_id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-dark-500">
              {/* Branch header */}
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-600 bg-primary/5 px-4 py-2.5">
                <BuildingOfficeIcon className="size-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  {branch.branch_name}
                </span>
                <Badge color="info" variant="soft" className="ml-auto text-xs">
                  {branch.customers.length} customers
                </Badge>
              </div>

              {/* Branch table */}
              <div className="overflow-x-auto">
                <Table hoverable className="w-full min-w-[500px] text-left">
                  <THead>
                    <Tr>
                      <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300 w-12">#</Th>
                      <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300">Customer</Th>
                      <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300">Phone</Th>
                      <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300 text-right">Total Sales</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {branch.customers.map((c, idx) => (
                      <Tr key={c.customer_id}>
                        <Td className="text-xs text-gray-400 dark:text-dark-500">{idx + 1}</Td>
                        <Td className="font-medium text-gray-800 dark:text-dark-100">{c.customer_name}</Td>
                        <Td className="text-gray-600 dark:text-dark-300">
                          <span className="flex items-center gap-1.5">
                            <PhoneIcon className="size-3 text-gray-400" />
                            {c.customer_phone || "—"}
                          </span>
                        </Td>
                        <Td className="text-right font-semibold text-success-600 dark:text-success-400">
                          ₹{c.total_sales.toFixed(2)}
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SchemeReportPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<SchemeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});

  const fetchReport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await Get(`pos/scheme-offers/${id}/report/`);
      // Axios wraps response body in .data; some endpoints double-wrap
      const raw = res?.data ?? res;
      const data = raw?.data ?? raw;

      if (data && typeof data === "object" && data.scheme_id) {
        // Normalise: filter out any null/undefined sparse-array entries in months
        const normalised: SchemeReport = {
          ...data,
          amount: Number(data.amount ?? 0),
          months: (data.months ?? []).filter(Boolean).map((m: MonthReport) => ({
            ...m,
            branches: (m.branches ?? []).filter(Boolean).map((b: BranchReport) => ({
              ...b,
              customers: (b.customers ?? []).filter(Boolean),
            })),
          })),
        };
        setReport(normalised);
        // Auto-expand first month that has customers
        const first = normalised.months.find((m) => m.branches?.length > 0);
        if (first) setOpenMonths({ [`${first.year}-${first.month}`]: true });
      } else {
        toasterrormsg("Invalid report data");
        navigate("/SchemeOffer");
      }
    } catch (err: any) {
      toasterrormsg(err?.response?.data?.message || "Failed to load report");
      navigate("/SchemeOffer");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const toggleMonth = (key: string) =>
    setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalCustomers = useMemo(() =>
    report?.months?.reduce((s, m) =>
      s + (m.branches?.reduce((bs, b) => bs + b.customers.length, 0) || 0), 0) ?? 0,
    [report]);

  // ── Loading ──
  if (loading) {
    return (
      <Page title="Scheme Report">
        <div className="transition-content flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <ArrowPathIcon className="mx-auto size-8 animate-spin text-primary-500" />
            <p className="mt-3 text-sm text-gray-500 dark:text-dark-400">Loading report…</p>
          </div>
        </div>
      </Page>
    );
  }

  // ── Not found ──
  if (!report) {
    return (
      <Page title="Scheme Report">
        <div className="transition-content flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-gray-500 dark:text-dark-400">
            <CubeIcon className="mx-auto size-12 text-gray-300 dark:text-dark-600" />
            <p className="mt-3 text-base font-medium">Report not found</p>
            <Button variant="outlined" className="mt-4 gap-2" onClick={() => navigate("/SchemeOffer")}>
              <ArrowLeftIcon className="size-4" /> Back to Schemes
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title={`${report.offer_name} — Report`}>
      <div className="transition-content w-full pb-8">

        {/* ── Page header ── */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outlined"
              className="h-8 gap-2 rounded-md px-3 text-sm"
              onClick={() => navigate("/SchemeOffer")}
            >
              <ArrowLeftIcon className="size-4" /> Back to Schemes
            </Button>
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
                {report.offer_name}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">
                Scheme Report &nbsp;·&nbsp; {formatDateDDMMYYYY(report.start_date)} — {formatDateDDMMYYYY(report.end_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={() => window.print()}>
              <PrinterIcon className="size-4" /> Print
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm">
              <DocumentArrowDownIcon className="size-4" /> Export
            </Button>
          </div>
        </div>

        {/* ── Colorful summary cards ── */}
        <div className="px-(--margin-x) mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {/* Scheme Name */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <TagIcon className="size-4 text-white" />
            </div>
            <p className="text-base font-bold truncate">{report.offer_name}</p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Scheme Name</p>
          </div>

          {/* Threshold */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <BanknotesIcon className="size-4 text-white" />
            </div>
            <p className="text-2xl font-bold tabular-nums">₹{report.amount.toFixed(2)}</p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Threshold</p>
          </div>

          {/* Period */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <CalendarDaysIcon className="size-4 text-white" />
            </div>
            <p className="text-sm font-bold">
              {formatDateDDMMYYYY(report.start_date)} → {formatDateDDMMYYYY(report.end_date)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Period</p>
          </div>

          {/* Type */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 p-4 text-white shadow-md">
            <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-14 rounded-full bg-white/10" />
            <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
              <CubeIcon className="size-4 text-white" />
            </div>
            <p className="text-base font-bold capitalize">
              {TYPE_LABEL[report.scheme_type] || report.scheme_type?.replace("_", " ")}
            </p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Type</p>
          </div>

          {/* Customers qualified */}
          <div className={clsx(
            "relative overflow-hidden rounded-xl p-4 text-white shadow-md",
            totalCustomers > 0
              ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
              : "bg-gradient-to-br from-gray-500 to-gray-600",
          )}>
            <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 size-14 rounded-full bg-white/10" />
            <div className="mb-2 flex items-center justify-between">
              <div className="grid size-8 place-items-center rounded-lg bg-white/20">
                <UsersIcon className="size-4 text-white" />
              </div>
              <Badge
                color={STATUS_COLOR[report.status] ?? "neutral"}
                variant="soft"
                className="text-[10px] bg-white/20 text-white border-0"
              >
                {STATUS_LABEL[report.status] || report.status}
              </Badge>
            </div>
            <p className="text-2xl font-bold tabular-nums">{totalCustomers}</p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Customers Qualified</p>
          </div>
        </div>

        {/* ── Month-wise accordion ── */}
        <div className="px-(--margin-x) mt-5 space-y-3">
          {report.months?.length ? report.months.map((m) => {
            const key = `${m.year}-${m.month}`;
            return (
              <MonthAccordion
                key={key}
                month={m}
                isOpen={!!openMonths[key]}
                onToggle={() => toggleMonth(key)}
              />
            );
          }) : (
            <div className="rounded-2xl border border-gray-200 bg-white dark:border-dark-500 dark:bg-dark-750 py-16 text-center text-gray-400 dark:text-dark-400">
              <UsersIcon className="mx-auto mb-2 size-10 opacity-30" />
              <p className="text-sm">No monthly data available</p>
            </div>
          )}
        </div>

      </div>
    </Page>
  );
}
