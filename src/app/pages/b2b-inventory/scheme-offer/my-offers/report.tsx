// src/app/pages/b2b-inventory/scheme-offer/my-offers/report.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhoneIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  CubeIcon,
  MegaphoneIcon,
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

// ─── Status Badge Config ───────────────────────────────────────────────────

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

// ─── Month Accordion Item ──────────────────────────────────────────────────

function MonthAccordion({
  month,
  isOpen,
  onToggle,
}: {
  month: MonthReport;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const monthCustomers = month.branches?.reduce((s, b) => s + b.customers.length, 0) || 0;

  return (
    <Card skin="bordered" className="overflow-hidden">
      {/* Header - Click to toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex justify-between items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
      >
        <span className="font-semibold text-gray-800 dark:text-dark-100 text-base">
          {month.label}
        </span>
        <span className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-400">
          {monthCustomers > 0 ? (
            <>
              <Badge color="primary" variant="soft" className="text-xs">
                {monthCustomers} customer{monthCustomers > 1 ? "s" : ""}
              </Badge>
              <span>qualified</span>
            </>
          ) : (
            <span className="text-gray-400 dark:text-dark-500">No customers qualified</span>
          )}
          {isOpen ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
        </span>
      </button>

      {/* Content - Expandable */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-5">
          {month.branches?.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-dark-400 italic text-center py-4">
              No customer crossed the threshold this month.
            </p>
          ) : (
            month.branches?.map((branch: BranchReport) => (
              <Card key={branch.branch_id} skin="bordered" className="overflow-hidden">
                {/* Branch Header */}
                <div className="bg-primary-50 dark:bg-primary-900/20 px-4 py-2.5 text-sm font-semibold text-primary-700 dark:text-primary-300 flex items-center gap-2">
                  <BuildingOfficeIcon className="size-4" />
                  {branch.branch_name} ({branch.customers.length} customers)
                </div>

                {/* Branch Table */}
                <div className="overflow-x-auto">
                  <Table hoverable className="w-full min-w-[500px] text-left">
                    <THead>
                      <Tr>
                        <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300 w-12">
                          #
                        </Th>
                        <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300">
                          Customer
                        </Th>
                        <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300">
                          Phone
                        </Th>
                        <Th className="bg-primary/10 text-xs font-semibold text-primary-700 dark:bg-primary/20 dark:text-primary-300 text-right">
                          Total Sales
                        </Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {branch.customers?.map((c: CustomerRow, idx: number) => (
                        <Tr key={c.customer_id}>
                          <Td className="text-gray-400 dark:text-dark-500 text-xs">
                            {idx + 1}
                          </Td>
                          <Td className="font-medium text-gray-800 dark:text-dark-100">
                            {c.customer_name}
                          </Td>
                          <Td className="text-gray-600 dark:text-dark-300 flex items-center gap-1.5">
                            <PhoneIcon className="size-3 text-gray-400" />
                            {c.customer_phone || "-"}
                          </Td>
                          <Td className="text-right font-semibold text-success-600 dark:text-success-400">
                            ₹{c.total_sales.toFixed(2)}
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function MySchemeReportPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<SchemeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // ── Fetch Report ──
  const fetchReport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await Get(`pos/scheme-offers/${id}/report/`);
      const data = res?.data ?? res;
      
      if (data && typeof data === 'object') {
        setReport(data);
        
        const firstWithData = data?.months?.find((m: MonthReport) => m.branches?.length > 0);
        if (firstWithData) {
          setOpenMonths({ [`${firstWithData.year}-${firstWithData.month}`]: true });
        }
      } else {
        toasterrormsg("Invalid report data received");
        navigate("/b2b-inventory/scheme-offer/my-offers");
      }
    } catch (err: any) {
      console.error("Error fetching report:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to load report";
      toasterrormsg(msg);
      navigate("/b2b-inventory/scheme-offer/my-offers");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Toggle Month ──
  const toggleMonth = (key: string) => {
    setOpenMonths((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── All Customers (for pagination) ──
  const allCustomers = useMemo(() => {
    if (!report?.months) return [];
    return report.months.flatMap((m) => m.branches?.flatMap((b) => b.customers || []) || []);
  }, [report]);

  const totalCustomers = allCustomers.length;
  const totalPages = Math.ceil(totalCustomers / pageSize);

  // ── Loading ──
  if (loading) {
    return (
      <Page title="Scheme Report - My Branch">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-sm text-gray-500 dark:text-dark-400">Loading report...</p>
          </div>
        </div>
      </Page>
    );
  }

  // ── Not Found ──
  if (!report) {
    return (
      <Page title="Scheme Report - My Branch">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-gray-500 dark:text-dark-400">
            <CubeIcon className="mx-auto size-12 text-gray-300 dark:text-dark-600" />
            <p className="mt-4 text-lg font-medium">Report not found</p>
            <Button
              variant="outlined"
              className="mt-4"
              onClick={() => navigate("/b2b-inventory/scheme-offer/my-offers")}
            >
              <ArrowLeftIcon className="size-4 mr-2" /> Back to Offers
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  // ─── Render ───
  return (
    <Page title={`${report.offer_name} — My Branch Report`}>
      <div className="px-(--margin-x) pb-8 space-y-5">
        {/* ─── Header ─── */}
        <div className=" flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outlined"
            className="gap-2"
            onClick={() => navigate("/b2b-inventory/scheme-offer/my-offers")}
          >
            <ArrowLeftIcon className="size-4" /> Back to Offers
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outlined" className="gap-2">
              <PrinterIcon className="size-4" /> Print
            </Button>
            <Button variant="outlined" className="gap-2">
              <DocumentArrowDownIcon className="size-4" /> Export
            </Button>
          </div>
        </div>

        {/* ─── Summary Cards ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card skin="bordered" className="p-4">
            <p className="text-xs text-gray-500 dark:text-dark-400">Scheme Name</p>
            <p className="font-semibold text-sm truncate text-gray-800 dark:text-dark-100">
              {report.offer_name}
            </p>
          </Card>
          <Card skin="bordered" className="p-4">
            <p className="text-xs text-gray-500 dark:text-dark-400">Threshold</p>
            <p className="font-bold text-primary-600 dark:text-primary-400">
              ₹{report.amount.toFixed(2)}
            </p>
          </Card>
          <Card skin="bordered" className="p-4">
            <p className="text-xs text-gray-500 dark:text-dark-400">Period</p>
            <p className="text-sm font-medium text-gray-700 dark:text-dark-200">
              {formatDateDDMMYYYY(report.start_date)} → {formatDateDDMMYYYY(report.end_date)}
            </p>
          </Card>
          <Card skin="bordered" className="p-4">
            <p className="text-xs text-gray-500 dark:text-dark-400">Status</p>
            <Badge
              color={STATUS_COLOR[report.status] ?? "neutral"}
              variant="soft"
              className="text-xs"
            >
              {STATUS_LABEL[report.status] || report.status}
            </Badge>
          </Card>
        </div>

        {/* ─── Total Customers ─── */}
        <Card skin="bordered" className="p-4">
          <p className="text-sm text-gray-600 dark:text-dark-300 flex items-center gap-2">
            <UsersIcon className="size-4 text-primary-500" />
            Total Customers Qualified:{" "}
            <span className="font-bold text-success-600 dark:text-success-400">
              {totalCustomers}
            </span>
          </p>
        </Card>

        {/* ─── Month-wise Report ─── */}
        <div className="space-y-3">
          {report.months?.map((m: MonthReport) => {
            const key = `${m.year}-${m.month}`;
            return (
              <MonthAccordion
                key={key}
                month={m}
                isOpen={!!openMonths[key]}
                onToggle={() => toggleMonth(key)}
              />
            );
          })}
        </div>

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-3">
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-dark-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outlined"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Page>
  );
}