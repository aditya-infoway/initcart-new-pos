import {
  ArrowPathIcon, EyeIcon, XMarkIcon, BuildingOfficeIcon,
  ArrowLeftIcon, ClipboardIcon, MagnifyingGlassIcon, CheckIcon,
  CheckCircleIcon, ExclamationTriangleIcon, CubeIcon, BuildingStorefrontIcon,
  ChartBarIcon, PhoneIcon, MapPinIcon, UserIcon, DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Fragment } from "react";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Card, Input, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { safeGet, toasterrormsg, toastsuccessmsg, formatDateDDMMYYYY, safePost } from "@/ApiHelper";
import { usePermission } from "@/hooks/usePermissions";

interface TransferHop {
  hop_type: "stock_transfer" | "b2b_transfer";
  hop_label: string;
  transfer_no: string;
  from_branch_name: string;
  to_branch_name: string;
  transfer_date: string;
  quantity: number;
  status: string;
}

interface BranchDetails {
  id: number; name: string; phone: string; email: string; address: string;
  city: string; state: string; pincode: string; owner_name: string;
  branch_type: string; status: string;
}

interface ReturnItem {
  id: number;
  item_name: string;
  variant_info: string;
  barcode: string;
  size: string;
  color: string;
  hsnCode: string;
  taxSlab: string;
  quantity: number;
  rate: number;
  is_packaging_ready: boolean;
  is_returned_to_company: boolean;
  status: string;
  company_stock: number;
  branch_stock: number;
  branch_variant_id: number;
  company_variant_id: number;
  tax_percent?: string;
  basic_amount?: number | string;
  tax_amount?: number | string;
  cgst?: number | string;
  sgst?: number | string;
  igst?: number | string;
  net_amount?: number | string;
  transfer_chain: TransferHop[];
}

interface ReturnDetail {
  id: number;
  return_no: string;
  branch_name: string;
  to_branch_name: string;
  return_date: string;
  note: string;
  status: string;
  source_b2b_transfer_no: string;
  items: ReturnItem[];
  created_at: string;
  updated_at: string;
  branch_details: BranchDetails;
  to_branch_details: BranchDetails;
}

interface ReturnListItem {
  id: number;
  return_no: string;
  branch_name: string;
  to_branch_name: string;
  return_date: string;
  status: string;
  item_count: number;
  total_quantity: number;
  note: string;
  created_at: string;
  source_b2b_transfer_no: string;
}

type Stage = "pending" | "packaging_ready" | "approved" | "received" | "rejected" | "cancelled";
type BadgeColor = "primary" | "info" | "success" | "warning" | "error" | "neutral";

const STAGE_CONFIG: Record<Stage, { label: string; color: BadgeColor }> = {
  pending: { label: "Pending", color: "warning" },
  packaging_ready: { label: "Packaging Ready", color: "primary" },
  approved: { label: "Approved", color: "success" },
  received: { label: "Received", color: "success" },
  rejected: { label: "Rejected", color: "error" },
  cancelled: { label: "Cancelled", color: "neutral" },
};

const STAGE_COLUMNS: { key: Stage; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "packaging_ready", label: "Packaging Ready" },
  { key: "approved", label: "Approved" },
  { key: "received", label: "Received" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];

function StageBadge({ stage }: { stage: Stage }) {
  const c = STAGE_CONFIG[stage] || { label: stage || "Unknown", color: "neutral" as BadgeColor };
  return <Badge color={c.color} variant="soft" className="text-xs font-semibold">{c.label}</Badge>;
}

// ── GST helpers ───────────────────────────────────────────
const safeNum = (val: any): number => {
  if (val === null || val === undefined || val === "") return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
};

interface GstTotals {
  basic: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  net: number;
}

// ── Reusable GST Summary Card ──────────────────────────────
const GstSummaryCard: React.FC<{ totals: GstTotals; title?: string }> = ({
  totals,
  title = "GST Summary",
}) => (
  <Card className="p-4 bg-primary/5 border-primary/200">
    <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100 mb-4">{title}</h3>
    <div className="space-y-1 text-sm">
      <div className="flex justify-between py-1.5 border-b border-primary/200 dark:border-dark-600">
        <span className="text-gray-600 dark:text-dark-300">Total Basic Amount</span>
        <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.basic.toFixed(2)}</span>
      </div>
      {totals.cgst > 0 || totals.sgst > 0 ? (
        <>
          <div className="flex justify-between py-1.5 border-b border-primary/200 dark:border-dark-600">
            <span className="text-gray-600 dark:text-dark-300">CGST</span>
            <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-primary/200 dark:border-dark-600">
            <span className="text-gray-600 dark:text-dark-300">SGST</span>
            <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.sgst.toFixed(2)}</span>
          </div>
        </>
      ) : totals.igst > 0 ? (
        <div className="flex justify-between py-1.5 border-b border-primary/200 dark:border-dark-600">
          <span className="text-gray-600 dark:text-dark-300">IGST</span>
          <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.igst.toFixed(2)}</span>
        </div>
      ) : null}
      <div className="flex justify-between pt-2 text-base font-bold">
        <span className="text-gray-700 dark:text-dark-200">Total Tax Amount</span>
        <span className="text-primary-700 dark:text-primary-400">₹ {totals.tax.toFixed(2)}</span>
      </div>
      <div className="flex justify-between pt-2 text-base font-bold border-t-2 border-primary/300 dark:border-dark-600">
        <span className="text-gray-700 dark:text-dark-200">Net Total (incl. GST)</span>
        <span className="text-primary-700 dark:text-primary-400">₹ {totals.net.toFixed(2)}</span>
      </div>
    </div>
  </Card>
);

// ── Reusable Branch Info Card ──────────────────────────────
const BranchInfoCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  details: BranchDetails | null;
}> = ({ title, icon, details }) => {
  if (!details) return null;

  return (
    <Card className="p-4 bg-primary/5 border-primary/200">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-primary-800 dark:text-primary-400">{title}</span>
      </div>
      <div className="mb-3">
        <div className="font-semibold text-gray-800 dark:text-dark-100 text-sm">{details.name}</div>
        {(details.city || details.state) && (
          <div className="text-xs text-gray-400 dark:text-dark-400 mt-0.5">
            {details.city}{details.city && details.state ? ', ' : ''}{details.state} {details.pincode}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="text-xs">
          <label className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-dark-400 mb-1">
            <PhoneIcon className="size-3" /> Phone
          </label>
          <div className="px-2.5 py-1.5 border border-primary/200 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-800 text-gray-700 dark:text-dark-200">
            {details.phone || "—"}
          </div>
        </div>
        <div className="text-xs">
          <label className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-dark-400 mb-1">
            <UserIcon className="size-3" /> Owner
          </label>
          <div className="px-2.5 py-1.5 border border-primary/200 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-800 text-gray-700 dark:text-dark-200">
            {details.owner_name || "—"}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-1.5 font-medium text-gray-500 dark:text-dark-400 mb-1">
            <MapPinIcon className="size-3" /> Address
          </label>
          <div className="px-2.5 py-1.5 border border-primary/200 dark:border-dark-600 rounded-lg text-xs bg-white dark:bg-dark-800 text-gray-700 dark:text-dark-200">
            {details.address || "—"}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ── Main Component ──────────────────────────────────────────

export default function StockReturnManagementPage() {
  const navigate = useNavigate();
  const { canAdd, canView } = usePermission("/stock-return-management");

  const [returns, setReturns] = useState<ReturnListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"branches" | "list">("branches");
  const [branchFilter, setBranchFilter] = useState<{ branch_name: string; status: Stage | "" } | null>(null);
  const [search, setSearch] = useState("");
  const [listPage, setListPage] = useState(1);

  const [selectedReturn, setSelectedReturn] = useState<ReturnDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const PAGE_SIZE = 15;

  // ✅ OLD FILE API PATH: "admin/stock-returns/"
// ✅ FIXED: loadAllReturns function
const loadAllReturns = useCallback(async () => {
  setLoading(true);
  try {
    let page = 1;
    let all: ReturnListItem[] = [];
    while (true) {
      const res = await safeGet("pos/admin/stock-returns/", { page, page_size: 1000 }) as any;
      
      // ✅ FIX: root level se count/next/previous lo
      const count = res?.data?.count ?? res?.count ?? 0;
      const next = res?.data?.next ?? res?.next ?? null;
      
      // ✅ FIX: results object se data array lo
      const resultsObj = res?.data?.results ?? res?.results ?? {};
      const arr: ReturnListItem[] = resultsObj.data || resultsObj || [];
      
      all = all.concat(arr);
      
      if (!next || arr.length === 0) break;
      page++;
      if (page > 200) break;
    }
    setReturns(all);
  } catch (e: any) {
    setReturns([]);
    const status = e?.response?.status ?? 0;
    if (status >= 500) toasterrormsg("Could not load returns");
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => { loadAllReturns(); }, [loadAllReturns]);

  const branchSummary = useMemo(() => {
    const map = new Map<string, any>();
    returns.forEach(r => {
      if (!map.has(r.branch_name)) {
        const row: any = { branch_name: r.branch_name, total: 0 };
        STAGE_COLUMNS.forEach(sc => (row[sc.key] = 0));
        map.set(r.branch_name, row);
      }
      const row = map.get(r.branch_name)!;
      row.total++;
      if (r.status in row) row[r.status] += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.branch_name.localeCompare(b.branch_name));
  }, [returns]);

  const filteredReturns = useMemo(() => {
    if (!branchFilter) return [];
    const q = search.trim().toLowerCase();
    return returns.filter(r =>
      r.branch_name === branchFilter.branch_name &&
      (branchFilter.status === "" || r.status === branchFilter.status) &&
      (q === "" || r.return_no.toLowerCase().includes(q) || r.branch_name.toLowerCase().includes(q))
    );
  }, [returns, branchFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / PAGE_SIZE));
  const pagedReturns = filteredReturns.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  const openBranchStatus = (branch_name: string, status: Stage | "") => {
    setBranchFilter({ branch_name, status });
    setSearch("");
    setListPage(1);
    setView("list");
  };

  const stageColKeys = STAGE_COLUMNS.map(s => s.key);

  // ✅ OLD FILE API PATH: "stock-returns/${id}/"
  const loadReturnDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await safeGet(`pos/stock-returns/${id}/`) as any;
      if (res?.data?.success) setSelectedReturn(res.data.data);
    } catch (e: any) {
      toasterrormsg("Could not load return detail");
    }
    setDetailLoading(false);
  };

  // ✅ OLD FILE API PATH: "admin/stock-returns/${id}/process/"
  const handleApprove = async (id: number) => {
    const confirmed = window.confirm("Approve return request? This will allow the branch to package items for this return.");
    if (!confirmed) return;
    setProcessing(true);
    try {
      const res = await safePost(`pos/admin/stock-returns/${id}/process/`, { action: "approve", note: "" }) as any;
      if (res?.data?.success) {
        toastsuccessmsg(res?.data?.message || "Return approved successfully");
        setSelectedReturn(null);
        loadAllReturns();
      } else {
        toasterrormsg(res?.data?.message || "Action failed");
      }
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.message || "Error processing return");
    }
    setProcessing(false);
  };

  // ✅ OLD FILE API PATH: "admin/stock-returns/${id}/process/"
  const handleReject = async (id: number, note: string) => {
    if (!note.trim()) {
      toasterrormsg("Please provide a reason for rejection.");
      return;
    }
    const confirmed = window.confirm(`Reject return request? Reason: "${note}"`);
    if (!confirmed) return;
    setProcessing(true);
    try {
      const res = await safePost(`pos/admin/stock-returns/${id}/process/`, { action: "reject", note }) as any;
      if (res?.data?.success) {
        toastsuccessmsg(res?.data?.message || "Return rejected successfully");
        setSelectedReturn(null);
        setShowRejectModal(false);
        setRejectNote("");
        loadAllReturns();
      } else {
        toasterrormsg(res?.data?.message || "Action failed");
      }
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.message || "Error processing return");
    }
    setProcessing(false);
  };

 
  const handleReceive = async (id: number) => {
    const confirmed = window.confirm("Confirm receive return? This will increase stock in the company branch for all packaged items.");
    if (!confirmed) return;
    setProcessing(true);
    try {
      const res = await safePost(`pos/admin/stock-returns/${id}/receive/`) as any;
      if (res?.data?.success) {
        toastsuccessmsg(res?.data?.message || "Stock received successfully");
        setSelectedReturn(null);
        loadAllReturns();
      } else {
        toasterrormsg(res?.data?.message || "Failed to receive return");
      }
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.message || "Error receiving return");
    }
    setProcessing(false);
  };

  // ── Branch Summary View ──────────────────────────────────

  if (view === "branches") {
    return (
      <Page title="Stock Return Management">
        <div className="transition-content w-full pb-8 space-y-4">
          <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <BuildingOfficeIcon className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-dark-100">Stock Return Management</h1>
                <p className="text-xs text-gray-500 dark:text-dark-400">Track & manage returns from all branches</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="primary" variant="soft" className="text-sm font-semibold">
                {returns.length} Total Returns
              </Badge>
              <Button variant="outlined" className="gap-2" onClick={loadAllReturns}>
                <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} /> Refresh
              </Button>
            </div>
          </div>

          <div className="px-(--margin-x)">
            <Card skin="bordered" className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="text-primary size-4" />
                  <span className="font-semibold text-gray-700 dark:text-dark-200 text-sm">Returns From Branches</span>
                </div>
                <Badge color="primary" variant="soft" className="text-xs font-bold">{branchSummary.length} branches</Badge>
              </div>

              {loading ? (
                <div className="py-16 text-center">
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                  <p className="text-gray-400 dark:text-dark-400 text-sm">Loading branches...</p>
                </div>
              ) : branchSummary.length === 0 ? (
                <div className="py-16 text-center text-gray-400 dark:text-dark-400">
                  <BuildingOfficeIcon className="mx-auto mb-2 size-8 opacity-30" />
                  <p className="text-sm">No branch data found</p>
                </div>
              ) : (
                <div className="table-wrapper min-w-full overflow-x-auto">
                  <Table hoverable className="w-full text-left">
                    <THead>
                      <Tr>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Branch</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap text-center">All</Th>
                        {STAGE_COLUMNS.map(sc => (
                          <Th key={sc.key} className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap text-center">
                            {sc.label}
                          </Th>
                        ))}
                      </Tr>
                    </THead>
                    <TBody>
                      {branchSummary.map((row) => (
                        <Tr key={row.branch_name} className="dark:border-b-dark-500 border-b border-gray-100">
                          <Td className="bg-white dark:bg-dark-900 font-medium text-gray-700 dark:text-dark-200">{row.branch_name}</Td>
                          <Td className="bg-white dark:bg-dark-900 text-center">
                            <Button
                              variant="outlined"
                              className="h-7 px-3 text-xs font-bold min-w-[40px]"
                              onClick={() => openBranchStatus(row.branch_name, "")}
                            >
                              {row.total}
                            </Button>
                          </Td>
                          {stageColKeys.map(sc => (
                            <Td key={sc} className="bg-white dark:bg-dark-900 text-center">
                              <Button
                                variant="outlined"
                                className={clsx(
                                  "h-7 px-3 text-xs font-bold min-w-[40px]",
                                  !row[sc] && "opacity-30 cursor-not-allowed"
                                )}
                                onClick={() => row[sc] && openBranchStatus(row.branch_name, sc)}
                                disabled={!row[sc]}
                              >
                                {row[sc] || 0}
                              </Button>
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Page>
    );
  }

  // ── List View ────────────────────────────────────────────

  return (
    <Page title="Stock Return Management">
      <div className="transition-content w-full pb-8 space-y-4">
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Button variant="outlined" className="h-8 gap-2 rounded-md px-3 text-sm" onClick={() => { setView("branches"); setBranchFilter(null); }}>
              <ArrowLeftIcon className="size-4" /> Back to Branches
            </Button>
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="text-gray-400 size-4" />
              <span className="text-sm font-bold text-gray-800 dark:text-dark-100">{branchFilter?.branch_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="primary" variant="soft" className="text-sm font-semibold">
              {filteredReturns.length} Returns
            </Badge>
            <Button variant="outlined" className="gap-2" onClick={loadAllReturns}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </div>

        <div className="px-(--margin-x)">
          <Card skin="bordered" className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-600 dark:text-dark-200">Stage:</span>
              {(["", ...STAGE_COLUMNS.map(s => s.key)] as (Stage | "")[]).map(s => {
                const active = branchFilter?.status === s;
                return (
                  <Button
                    key={s || "all"}
                    color={active ? "primary" : undefined}
                    variant={active ? "filled" : "outlined"}
                    className="h-8 px-3 text-xs font-semibold"
                    onClick={() => { setBranchFilter(f => f ? { ...f, status: s } : f); setListPage(1); }}
                  >
                    {s === "" ? "All" : (STAGE_CONFIG[s]?.label || s)}
                  </Button>
                );
              })}
              <div className="ml-auto max-w-xs min-w-[220px]">
                <Input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setListPage(1); }}
                  placeholder="Search return no..."
                  prefix={<MagnifyingGlassIcon className="size-4 text-gray-400" />}
                  suffix={search ? (
                    <button
                      onClick={() => { setSearch(""); setListPage(1); }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="size-4" />
                    </button>
                  ) : undefined}
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="px-(--margin-x)">
          <Card skin="bordered" className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-600 bg-gray-50 dark:bg-dark-800 flex items-center gap-2">
              <ClipboardIcon className="text-primary size-4" />
              <span className="font-semibold text-gray-700 dark:text-dark-200 text-sm">Return Requests</span>
              <Badge color="primary" variant="soft" className="text-xs font-bold">{filteredReturns.length}</Badge>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
                <p className="text-gray-400 dark:text-dark-400 text-sm">Loading...</p>
              </div>
            ) : pagedReturns.length === 0 ? (
              <div className="py-16 text-center text-gray-400 dark:text-dark-400">
                <ClipboardIcon className="mx-auto mb-2 size-8 opacity-30" />
                <p className="text-sm">No returns found</p>
              </div>
            ) : (
              <>
                <div className="table-wrapper min-w-full overflow-x-auto">
                  <Table hoverable className="w-full text-left">
                    <THead>
                      <Tr>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Return No</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Branch</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Source B2B Transfer</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Date</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap text-center">Items</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap text-center">Qty</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap text-center">Stage</Th>
                        <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap text-center">Action</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {pagedReturns.map((r) => (
                        <Tr key={r.id} className="dark:border-b-dark-500 border-b border-gray-100">
                          <Td className="bg-white dark:bg-dark-900">
                            <span className="font-bold text-primary-600 dark:text-primary-400">{r.return_no}</span>
                          </Td>
                          <Td className="bg-white dark:bg-dark-900 font-medium text-gray-700 dark:text-dark-200">{r.branch_name}</Td>
                          <Td className="bg-white dark:bg-dark-900 text-gray-600 dark:text-dark-300 text-xs">{r.source_b2b_transfer_no || "—"}</Td>
                          <Td className="bg-white dark:bg-dark-900 text-gray-500 dark:text-dark-300 text-xs">{formatDateDDMMYYYY(r.return_date)}</Td>
                          <Td className="bg-white dark:bg-dark-900 text-center">
                            <Badge color="neutral" variant="soft" className="text-xs font-semibold">{r.item_count}</Badge>
                          </Td>
                          <Td className="bg-white dark:bg-dark-900 text-center">
                            <Badge color="primary" variant="soft" className="text-xs font-semibold">{r.total_quantity}</Badge>
                          </Td>
                          <Td className="bg-white dark:bg-dark-900 text-center">
                            <StageBadge stage={r.status as Stage} />
                          </Td>
                          <Td className="bg-white dark:bg-dark-900 text-center">
                            <Button
                              color="primary"
                              variant="soft"
                              className="h-7 px-3 text-xs font-semibold"
                              onClick={() => loadReturnDetail(r.id)}
                            >
                              <EyeIcon className="inline mr-1 size-3" /> View
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="px-5 py-3 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between bg-gray-50/50 dark:bg-dark-800/50">
                    <span className="text-xs text-gray-500 dark:text-dark-400">
                      Showing {(listPage - 1) * PAGE_SIZE + 1}–{Math.min(listPage * PAGE_SIZE, filteredReturns.length)} of {filteredReturns.length} returns
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outlined"
                        className="h-7 px-3 text-xs"
                        disabled={listPage <= 1}
                        onClick={() => setListPage(p => p - 1)}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outlined"
                        className="h-7 px-3 text-xs"
                        disabled={listPage >= totalPages}
                        onClick={() => setListPage(p => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* ── Detail View Modal ──────────────────────────────── */}

      <Transition appear show={!!selectedReturn} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
          onClose={() => setSelectedReturn(null)}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur transition-opacity dark:bg-black/30" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative flex w-full max-w-7xl origin-top flex-col overflow-hidden rounded-lg bg-white transition-all duration-300 dark:bg-dark-700 max-h-[90vh]">
              <div className="flex items-center justify-between rounded-t-lg bg-gray-200 px-4 py-3 dark:bg-dark-800 sm:px-5">
                <DialogTitle
                  as="h3"
                  className="text-base font-medium text-gray-800 dark:text-dark-100"
                >
                  {selectedReturn?.return_no} - {STAGE_CONFIG[selectedReturn?.status as Stage]?.label || selectedReturn?.status}
                </DialogTitle>
                <Button
                  onClick={() => setSelectedReturn(null)}
                  variant="outlined"
                  className="size-7 rounded-full ltr:-mr-1.5 rtl:-ml-1.5"
                >
                  <XMarkIcon className="size-4.5" />
                </Button>
              </div>

              <div className="flex flex-col overflow-y-auto px-4 py-4 sm:px-5">
                {selectedReturn && (
                  <ReturnDetailView
                    returnData={selectedReturn}
                    onBack={() => { setSelectedReturn(null); loadAllReturns(); }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onReceive={handleReceive}
                    processing={processing}
                    rejectNote={rejectNote}
                    setRejectNote={setRejectNote}
                    showRejectModal={showRejectModal}
                    setShowRejectModal={setShowRejectModal}
                  />
                )}
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {/* ── Reject Modal ────────────────────────────────────── */}

      <Transition appear show={showRejectModal} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
          onClose={() => setShowRejectModal(false)}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur transition-opacity dark:bg-black/30" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="relative flex w-full max-w-md origin-top flex-col overflow-hidden rounded-lg bg-white transition-all duration-300 dark:bg-dark-700">
              <div className="flex items-center justify-between rounded-t-lg bg-gray-200 px-4 py-3 dark:bg-dark-800 sm:px-5">
                <DialogTitle
                  as="h3"
                  className="text-base font-medium text-gray-800 dark:text-dark-100"
                >
                  Reject Return
                </DialogTitle>
                <Button
                  onClick={() => setShowRejectModal(false)}
                  variant="outlined"
                  className="size-7 rounded-full ltr:-mr-1.5 rtl:-ml-1.5"
                >
                  <XMarkIcon className="size-4.5" />
                </Button>
              </div>

              <div className="flex flex-col overflow-y-auto px-4 py-4 sm:px-5">
                <Card className="p-3 bg-error/5 border-error/200 text-error-600 text-sm flex items-center gap-2">
                  <XMarkIcon className="size-4" /> This will reject the return request.
                </Card>
                <p className="text-sm text-gray-600 dark:text-dark-300 mt-4 mb-3">Please provide a reason for rejection:</p>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full border-2 border-gray-200 dark:border-dark-600 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-error-500 min-h-[100px] resize-none bg-white dark:bg-dark-800 text-gray-800 dark:text-dark-100"
                />
                <div className="flex gap-3 justify-end mt-4">
                  <Button
                    variant="outlined"
                    onClick={() => setShowRejectModal(false)}
                    className="min-w-[7rem] rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    color="error"
                    onClick={() => {
                      if (selectedReturn) {
                        handleReject(selectedReturn.id, rejectNote);
                      }
                    }}
                    disabled={processing || !selectedReturn}
                    className="min-w-[7rem] rounded-full"
                  >
                    {processing ? "Processing..." : "Reject"}
                  </Button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </Page>
  );
}

// ── ReturnDetailView Component ─────────────────────────────

interface ReturnDetailViewProps {
  returnData: ReturnDetail;
  onBack: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, note: string) => void;
  onReceive: (id: number) => void;
  processing: boolean;
  rejectNote: string;
  setRejectNote: (note: string) => void;
  showRejectModal: boolean;
  setShowRejectModal: (show: boolean) => void;
}

function ReturnDetailView({
  returnData,
  onBack,
  onApprove,
  onReject,
  onReceive,
  processing,
  rejectNote,
  setRejectNote,
  showRejectModal,
  setShowRejectModal,
}: ReturnDetailViewProps) {
  const canApprove = returnData.status === "pending";
  const canReceive = returnData.status === "approved" || returnData.status === "packaging_ready";
  const isCompleted = returnData.status === "received" || returnData.status === "rejected";

  const totalPackaged = returnData.items.filter(i => i.is_packaging_ready).length;
  const totalItems = returnData.items.length;
  const allPackaged = totalPackaged === totalItems && totalItems > 0;

  const totalQty = returnData.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = returnData.items.reduce((sum, i) => sum + (i.quantity * i.rate), 0);

  const gstTotals: GstTotals = useMemo(() => {
    return returnData.items.reduce(
      (acc, i) => ({
        basic: acc.basic + safeNum(i.basic_amount),
        tax: acc.tax + safeNum(i.tax_amount),
        cgst: acc.cgst + safeNum(i.cgst),
        sgst: acc.sgst + safeNum(i.sgst),
        igst: acc.igst + safeNum(i.igst),
        net: acc.net + safeNum(i.net_amount),
      }),
      { basic: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, net: 0 }
    );
  }, [returnData.items]);

  const hasGst = gstTotals.basic > 0 || gstTotals.tax > 0;

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-xs text-gray-400 dark:text-dark-400 uppercase tracking-wide mb-1">Return Date</div>
          <div className="font-semibold text-gray-800 dark:text-dark-100 text-sm">{formatDateDDMMYYYY(returnData.return_date)}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-gray-400 dark:text-dark-400 uppercase tracking-wide mb-1">Source Transfer</div>
          <div className="font-semibold text-primary-600 dark:text-primary-400 text-sm">{returnData.source_b2b_transfer_no || "—"}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-gray-400 dark:text-dark-400 uppercase tracking-wide mb-1">Total Items</div>
          <div className="font-semibold text-gray-800 dark:text-dark-100 text-sm">{totalItems}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-gray-400 dark:text-dark-400 uppercase tracking-wide mb-1">Total Quantity</div>
          <div className="font-semibold text-gray-800 dark:text-dark-100 text-sm">{totalQty}</div>
        </Card>
      </div>

      {/* Branch Info - From Branch */}
      <BranchInfoCard
        title="From Branch"
        icon={<BuildingStorefrontIcon className="text-primary size-4" />}
        details={returnData.branch_details}
      />

      {/* Note */}
      {returnData.note && (
        <Card className="p-3 bg-primary/5 border-primary/200 dark:border-dark-600 flex items-start gap-2">
          <DocumentTextIcon className="text-primary size-4 mt-0.5" />
          <span className="text-xs text-primary-700 dark:text-primary-400">{returnData.note}</span>
        </Card>
      )}

      {/* Status Info */}
      <div className="flex flex-wrap gap-2 items-center justify-between px-2">
        <div className="flex flex-wrap gap-2">
          <Badge color="neutral" variant="soft" className="text-xs font-semibold">
            <CubeIcon className="inline size-3 mr-1" /> Total Items: {totalItems}
          </Badge>
          <Badge color="primary" variant="soft" className="text-xs font-semibold">
            <ChartBarIcon className="inline size-3 mr-1" /> Packaged: {totalPackaged}
          </Badge>
          <Badge color="warning" variant="soft" className="text-xs font-semibold">
            <ExclamationTriangleIcon className="inline size-3 mr-1" /> Pending: {totalItems - totalPackaged}
          </Badge>
        </div>
        <div className="text-xs text-gray-400 dark:text-dark-400">Created: {new Date(returnData.created_at).toLocaleString()}</div>
      </div>

      {/* Status Alerts */}
      {returnData.status === "pending" && (
        <Card className="p-3 bg-warning/5 border-warning/200 dark:border-dark-600 text-warning-700 dark:text-warning-400 text-sm flex items-center gap-2">
          <BuildingStorefrontIcon className="text-warning size-4" />
          <span>Awaiting approval. Branch cannot package until approved.</span>
        </Card>
      )}
      {returnData.status === "approved" && (
        <Card className="p-3 bg-success/5 border-success/200 dark:border-dark-600 text-success-700 dark:text-success-400 text-sm flex items-center gap-2">
          <CheckCircleIcon className="text-success size-4" />
          <span>Approved. Waiting for branch to mark items as packaged.</span>
        </Card>
      )}
      {returnData.status === "packaging_ready" && (
        <Card className="p-3 bg-primary/5 border-primary/200 dark:border-dark-600 text-primary-700 dark:text-primary-400 text-sm flex items-center gap-2">
          <ChartBarIcon className="text-primary size-4" />
          <span>All items packaged by branch. Ready for final receipt.</span>
        </Card>
      )}

      {/* Actions */}
      {!isCompleted && (
        <Card className="p-4 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-dark-200">Actions:</span>
            {canApprove && (
              <>
                <Button
                  color="success"
                  variant="filled"
                  className="text-sm font-semibold"
                  onClick={() => onApprove(returnData.id)}
                  disabled={processing}
                >
                  <CheckIcon className="inline size-4 mr-1" /> Approve
                </Button>
                <Button
                  color="error"
                  variant="filled"
                  className="text-sm font-semibold"
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                >
                  <XMarkIcon className="inline size-4 mr-1" /> Reject
                </Button>
              </>
            )}
            {canReceive && (
              <Button
                color="primary"
                variant="filled"
                className="text-sm font-semibold"
                onClick={() => onReceive(returnData.id)}
                disabled={processing || !allPackaged}
              >
                <CheckCircleIcon className="inline size-4 mr-1" /> Receive Stock
                {!allPackaged && <span className="text-xs ml-1">({totalPackaged}/{totalItems})</span>}
              </Button>
            )}
          </div>
          {canApprove && (
            <span className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-1.5">
              {allPackaged ? (
                <><CheckCircleIcon className="size-3.5 text-success" /> All items packaged</>
              ) : (
                <><ExclamationTriangleIcon className="size-3.5 text-warning" /> {totalItems - totalPackaged} items not packaged yet</>
              )}
            </span>
          )}
          {canReceive && !allPackaged && (
            <span className="text-xs text-warning-600 dark:text-warning-400 font-medium flex items-center gap-1.5">
              <ExclamationTriangleIcon className="size-4" /> Waiting for branch to package all items ({totalPackaged}/{totalItems})
            </span>
          )}
          {canReceive && allPackaged && (
            <span className="text-xs text-success-600 dark:text-success-400 font-medium flex items-center gap-1.5">
              <CheckCircleIcon className="size-4" /> All items packaged. Ready to receive.
            </span>
          )}
        </Card>
      )}

      {/* Items Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full text-sm min-w-[1250px]">
            <THead>
              <Tr>
                <Th className="text-left text-xs font-semibold text-gray-500 dark:text-dark-300">#</Th>
                <Th className="text-left text-xs font-semibold text-gray-500 dark:text-dark-300">Item Name</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">Variant</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">Barcode</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">HSN</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">GST</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">Qty</Th>
                <Th className="text-right text-xs font-semibold text-gray-500 dark:text-dark-300">Rate ₹</Th>
                <Th className="text-right text-xs font-semibold text-gray-500 dark:text-dark-300">Net ₹</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">Branch Stock</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">Company Stock</Th>
                <Th className="text-center text-xs font-semibold text-gray-500 dark:text-dark-300">Status</Th>
              </Tr>
            </THead>
            <TBody>
              {returnData.items.map((item, idx) => {
                const isPackaged = item.is_packaging_ready;
                const isReturned = item.is_returned_to_company;
                return (
                  <Tr key={item.id} className={clsx(
                    isReturned ? "bg-success/10" : isPackaged ? "bg-primary/10" : ""
                  )}>
                    <Td className="text-gray-400 dark:text-dark-400 text-xs">{idx + 1}</Td>
                    <Td className="font-semibold text-gray-800 dark:text-dark-100">{item.item_name}</Td>
                    <Td className="text-center">
                      <Badge color="primary" variant="soft" className="text-xs">{item.variant_info || "Default"}</Badge>
                    </Td>
                    <Td className="text-center font-mono text-xs text-gray-400 dark:text-dark-400">{item.barcode || "—"}</Td>
                    <Td className="text-center font-mono text-xs text-gray-500 dark:text-dark-400">{item.hsnCode || "—"}</Td>
                    <Td className="text-center">
                      <Badge color="primary" variant="soft" className="text-xs">{item.taxSlab || "0%"}</Badge>
                    </Td>
                    <Td className="text-center">
                      <Badge color="primary" variant="soft" className="text-xs font-semibold">{item.quantity}</Badge>
                    </Td>
                    <Td className="text-right font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
                      ₹{item.rate?.toFixed(2) || "0.00"}
                    </Td>
                    <Td className="text-right font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">
                      ₹{safeNum(item.net_amount).toFixed(2)}
                    </Td>
                    <Td className="text-center">
                      <span className={clsx("text-xs font-semibold", (item.branch_stock || 0) <= 0 ? "text-error-500" : "text-gray-700 dark:text-dark-200")}>
                        {item.branch_stock || 0}
                      </span>
                    </Td>
                    <Td className="text-center">
                      <span className="text-xs font-semibold text-gray-700 dark:text-dark-200">{item.company_stock || 0}</span>
                    </Td>
                    <Td className="text-center">
                      {isReturned ? (
                        <Badge color="success" variant="soft" className="text-xs font-semibold">
                          <CheckCircleIcon className="inline size-3 mr-1" /> Returned
                        </Badge>
                      ) : isPackaged ? (
                        <Badge color="primary" variant="soft" className="text-xs font-semibold">
                          <ChartBarIcon className="inline size-3 mr-1" /> Packaged
                        </Badge>
                      ) : (
                        <Badge color="warning" variant="soft" className="text-xs font-semibold">
                          <ExclamationTriangleIcon className="inline size-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
              {/* Totals row */}
              <Tr className="bg-gray-50 dark:bg-dark-800 border-t-2 border-gray-200 dark:border-dark-600">
                <Td colSpan={6} className="text-right font-semibold text-gray-600 dark:text-dark-200">
                  Total:
                </Td>
                <Td className="text-center font-bold text-primary-600 dark:text-primary-400">{totalQty}</Td>
                <Td className="text-right font-bold text-primary-600 dark:text-primary-400">₹{totalAmount.toFixed(2)}</Td>
                <Td className="text-right font-bold text-primary-700 dark:text-primary-400">₹{gstTotals.net.toFixed(2)}</Td>
                <Td colSpan={3} className="text-center text-xs text-gray-400 dark:text-dark-400">
                  {totalPackaged} of {totalItems} items packaged
                </Td>
              </Tr>
            </TBody>
          </Table>
        </div>
      </Card>

      {/* GST Summary */}
      {hasGst && <GstSummaryCard totals={gstTotals} />}

      {/* Footer Status Messages */}
      {returnData.status === "received" && (
        <Card className="p-3.5 bg-success/5 border-success/200 dark:border-dark-600 text-success-700 dark:text-success-400 text-sm flex items-center gap-2">
          <CheckCircleIcon className="size-5" /> Return fully received. Stock increased in company branch.
        </Card>
      )}
      {returnData.status === "rejected" && (
        <Card className="p-3.5 bg-error/5 border-error/200 dark:border-dark-600 text-error-600 dark:text-error-400 text-sm flex items-center gap-2">
          <XMarkIcon className="size-5" /> Return request rejected.
        </Card>
      )}
      {returnData.status === "approved" && (
        <Card className="p-3.5 bg-success/5 border-success/200 dark:border-dark-600 text-success-700 dark:text-success-400 text-sm flex items-center gap-2">
          <CheckCircleIcon className="size-5" /> Return approved. Waiting for branch packaging.
        </Card>
      )}
      {returnData.status === "packaging_ready" && (
        <Card className="p-3.5 bg-primary/5 border-primary/200 dark:border-dark-600 text-primary-700 dark:text-primary-400 text-sm flex items-center gap-2">
          <ChartBarIcon className="size-5" /> All items packaged. Click "Receive Stock" to complete.
        </Card>
      )}
      {returnData.status === "pending" && (
        <Card className="p-3.5 bg-warning/5 border-warning/200 dark:border-dark-600 text-warning-700 dark:text-warning-400 text-sm flex items-center gap-2">
          <ExclamationTriangleIcon className="size-5" /> Pending approval. Review items and approve or reject.
        </Card>
      )}
    </div>
  );
}