// src/app/pages/sales-master/b2b-sales/index.tsx
import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowDownTrayIcon, ArrowPathIcon, CubeIcon, EyeIcon,
  FunnelIcon, MagnifyingGlassIcon, PlusIcon, XMarkIcon,
  CheckCircleIcon, InformationCircleIcon, BuildingOfficeIcon,
  DocumentCheckIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Card, Input, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { Combobox } from "@/components/shared/form/StyledCombobox";
import { Get, Post, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";
import { usePermission } from "@/hooks/usePermissions";

// ── Types ──────────────────────────────────────────────────────────────────
interface B2BSaleItem {
  id: number;
  from_item_name: string;
  from_variant_info: string;
  from_barcode: string;
  quantity: number;
  rate: number;
  is_stock_updated: boolean;
  tax_percent?: string;
  basic_amount?: number;
  tax_amount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  net_amount?: number;
}

interface B2BSale {
  id: number;
  sale_no: string;
  from_branch_name: string;
  to_branch_name: string;
  sale_date: string;
  status: "pending" | "completed" | "cancelled";
  item_count: number;
  created_at: string;
  items?: B2BSaleItem[];
  note?: string;
  created_by_name?: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "warning",
  completed: "success",
  cancelled: "error",
};
const PAGE_SIZES = [10, 15, 25, 50, 100];

// ── Detail Drawer ──────────────────────────────────────────────────────────
function DetailDrawer({
  sale, onClose, onCancel, cancelling,
}: {
  sale: B2BSale | null;
  onClose: () => void;
  onCancel: (id: number) => void;
  cancelling: boolean;
}) {
  const gstTotals = useMemo(() => {
    const items = sale?.items ?? [];
    return items.reduce(
      (acc, i) => ({
        basic: acc.basic + Number(i.basic_amount || 0),
        tax: acc.tax + Number(i.tax_amount || 0),
        cgst: acc.cgst + Number(i.cgst || 0),
        sgst: acc.sgst + Number(i.sgst || 0),
        igst: acc.igst + Number(i.igst || 0),
        net: acc.net + Number(i.net_amount || 0),
      }),
      { basic: 0, tax: 0, cgst: 0, sgst: 0, igst: 0, net: 0 },
    );
  }, [sale?.items]);
  const hasGst = gstTotals.basic > 0 || gstTotals.tax > 0;

  const totalItems = sale?.items?.length || 0;
  const verifiedItems = sale?.items?.filter((i) => i.is_stock_updated).length || 0;

  return (
    <Transition appear show={!!sale} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={onClose}>
        <TransitionChild
          as="div"
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity dark:bg-black/40"
        />
        <TransitionChild
          as={DialogPanel}
          enter="ease-out transform-gpu transition-transform duration-200"
          enterFrom="translate-x-full" enterTo="translate-x-0"
          leave="ease-in transform-gpu transition-transform duration-200"
          leaveFrom="translate-x-0" leaveTo="translate-x-full"
          className="fixed top-0 right-0 flex h-full w-full lg:max-w-[72%] xl:max-w-[65%] transform-gpu flex-col bg-white dark:bg-dark-700"
        >
          {/* Header */}
          <div className="bg-primary flex shrink-0 items-start justify-between px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DocumentCheckIcon className="size-5" /> {sale?.sale_no || "Sale"}
              </h3>
              <p className="mt-0.5 text-xs text-white/70">
                B2B Sale Detail · {sale ? formatDateDDMMYYYY(sale.sale_date) : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {sale?.status && (
                <Badge color={STATUS_COLOR[sale.status] as any} variant="soft" className="text-xs font-semibold">
                  {STATUS_LABEL[sale.status]}
                </Badge>
              )}
              <Button onClick={onClose} variant="flat" isIcon
                className="size-8 rounded-full text-white hover:bg-white/10">
                <XMarkIcon className="size-5" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="hide-scrollbar grow overflow-y-auto px-5 py-5 space-y-4">
            {/* Meta */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "From Branch", value: sale?.from_branch_name || "-" },
                { label: "To Branch", value: sale?.to_branch_name || "-" },
                { label: "Sale Date", value: sale ? formatDateDDMMYYYY(sale.sale_date) : "-" },
                { label: "Created By", value: sale?.created_by_name || "-" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 dark:bg-dark-800">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                  <div className="font-semibold text-sm text-gray-800 dark:text-dark-100">{value}</div>
                </div>
              ))}
            </div>

            {sale?.note && (
              <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                <span className="text-xs text-primary-700 dark:text-primary-300">📝 {sale.note}</span>
              </div>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge color="neutral" variant="soft" className="text-xs font-semibold flex items-center gap-1.5">
                <CubeIcon className="size-3" /> Total Items: {totalItems}
              </Badge>
              <Badge color="success" variant="soft" className="text-xs font-semibold flex items-center gap-1.5">
                <CheckCircleIcon className="size-3" /> Verified: {verifiedItems}
              </Badge>
              <Badge color="warning" variant="soft" className="text-xs font-semibold flex items-center gap-1.5">
                <InformationCircleIcon className="size-3" /> Pending: {totalItems - verifiedItems}
              </Badge>
            </div>

            {/* Items table */}
            <div className="rounded-xl border border-gray-200 dark:border-dark-500 overflow-hidden">
              <div className="overflow-x-auto">
                <Table hoverable className="w-full text-left">
                  <THead>
                    <Tr>
                      {["#", "Item", "Variant", "Barcode", "Qty", "Rate ₹", "Status"].map((h) => (
                        <Th key={h} className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">
                          {h}
                        </Th>
                      ))}
                    </Tr>
                  </THead>
                  <TBody>
                    {(sale?.items?.length ?? 0) === 0 ? (
                      <Tr>
                        <Td colSpan={7} className="py-10 text-center text-sm text-gray-400">No items</Td>
                      </Tr>
                    ) : sale?.items?.map((item, idx) => (
                      <Tr key={item.id} className="dark:border-b-dark-500 border-b border-gray-100">
                        <Td className="text-gray-400 text-xs">{idx + 1}</Td>
                        <Td className="font-semibold text-gray-800 dark:text-dark-100">{item.from_item_name}</Td>
                        <Td><Badge color="info" variant="soft" className="text-xs">{item.from_variant_info || "Default"}</Badge></Td>
                        <Td className="font-mono text-xs text-gray-500">{item.from_barcode || "—"}</Td>
                        <Td><Badge color="primary" variant="soft" className="text-xs font-semibold">{item.quantity}</Badge></Td>
                        <Td className="font-mono text-xs text-gray-700">₹{Number(item.rate).toFixed(2)}</Td>
                        <Td>
                          {item.is_stock_updated ? (
                            <Badge color="success" variant="soft" className="text-xs font-semibold flex items-center gap-1 w-fit">
                              <CheckCircleIcon className="size-3" /> Verified
                            </Badge>
                          ) : (
                            <Badge color="warning" variant="soft" className="text-xs font-semibold flex items-center gap-1 w-fit">
                              <InformationCircleIcon className="size-3" /> Pending
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </div>

            {/* GST summary */}
            {hasGst && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100 mb-3">GST Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-800/20">
                    <span className="text-gray-600 dark:text-dark-300">Total Basic</span>
                    <span className="font-medium text-gray-800 dark:text-dark-100">₹ {gstTotals.basic.toFixed(2)}</span>
                  </div>
                  {gstTotals.cgst > 0 || gstTotals.sgst > 0 ? (
                    <>
                      <div className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-800/20">
                        <span className="text-gray-600 dark:text-dark-300">CGST</span>
                        <span className="font-medium text-gray-800 dark:text-dark-100">₹ {gstTotals.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-800/20">
                        <span className="text-gray-600 dark:text-dark-300">SGST</span>
                        <span className="font-medium text-gray-800 dark:text-dark-100">₹ {gstTotals.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  ) : gstTotals.igst > 0 ? (
                    <div className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-800/20">
                      <span className="text-gray-600 dark:text-dark-300">IGST</span>
                      <span className="font-medium text-gray-800 dark:text-dark-100">₹ {gstTotals.igst.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between pt-2 text-base font-bold border-t-2 border-emerald-300">
                    <span>Total Tax</span>
                    <span className="text-emerald-700 dark:text-emerald-400">₹ {gstTotals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold">
                    <span>Net Total</span>
                    <span className="text-emerald-700 dark:text-emerald-400">₹ {gstTotals.net.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status banners */}
            {sale?.status === "completed" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 flex items-center gap-2 text-sm dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircleIcon className="size-4" /> Sale completed successfully.
              </div>
            )}
            {sale?.status === "cancelled" && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 flex items-center gap-2 text-sm dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400">
                <XMarkIcon className="size-4" /> Sale has been cancelled.
              </div>
            )}
            {sale?.status === "pending" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 flex items-center gap-2 text-sm dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400">
                <InformationCircleIcon className="size-4" /> Sale is pending verification.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-500">
            <span className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-1.5">
              <InformationCircleIcon className="size-3.5 text-amber-500" />
              Cancel unverified items → stock recovered
            </span>
            <div className="flex gap-2">
              {sale?.status === "pending" && (
                <Button color="error" className="gap-1.5" disabled={cancelling}
                  onClick={() => onCancel(sale.id)}>
                  {cancelling ? (
                    <><span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Cancelling...</>
                  ) : (
                    <><XMarkIcon className="size-4" />Cancel Sale</>
                  )}
                </Button>
              )}
              <Button variant="outlined" onClick={onClose}>Close</Button>
            </div>
          </div>
        </TransitionChild>
      </Dialog>
    </Transition>
  );
}

// ── Main list ─────────────────────────────────────────────────────────────
export default function B2BSalesListPage() {
  const navigate = useNavigate();
  const { canAdd } = usePermission("/b2bsales");

  const [sales, setSales] = useState<B2BSale[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<{ label: string; value: string } | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selected, setSelected] = useState<B2BSale | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const reqIdRef = useRef(0);

  const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(globalFilter.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [globalFilter]);

  const buildParams = (extra: Record<string, any> = {}) => {
    const params: Record<string, any> = { ...extra };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter?.value) params.status = statusFilter.value;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return params;
  };

  const fetchPage = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res: any = await Get("pos/b2b-sales/", {
        ...buildParams({ page, page_size: pageSize }),
      });
      if (reqId !== reqIdRef.current) return;
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body?.results)
        ? body.results
        : Array.isArray(body)
          ? body
          : [];
      setSales(rows.map((r) => ({
        id: r.id,
        sale_no: r.sale_no,
        from_branch_name: r.from_branch_name || "-",
        to_branch_name: r.to_branch_name || "-",
        sale_date: r.sale_date,
        status: r.status || "pending",
        item_count: r.item_count || 0,
        created_at: r.created_at,
        created_by_name: r.created_by_name,
      })));
      setTotalCount(Number(body?.count ?? rows.length));
    } catch (err: any) {
      if (reqId !== reqIdRef.current) return;
      if (err?.response?.status === 404 && page > 1) {
        setPage(1);
        return;
      }
      toast.error("Failed to load B2B sales.");
      setSales([]);
      setTotalCount(0);
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, statusFilter?.value, startDate, endDate]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasActiveFilters = !!statusFilter?.value || !!startDate || !!endDate;

  const clearFilters = () => {
    setStatusFilter(null);
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // ── Export ─────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (exporting) return;
    if (totalCount === 0) { toast.warning("No data to export."); return; }
    setExporting(true);
    try {
      let all: B2BSale[] = [];
      let nextPage = 1;
      while (true) {
        const res: any = await Get("pos/b2b-sales/", {
          ...buildParams({ page: nextPage, page_size: 200 }),
        });
        const body = res?.data ?? res;
        const rows: any[] = Array.isArray(body?.results)
          ? body.results
          : Array.isArray(body)
            ? body
            : [];
        all = [...all, ...rows.map((r) => ({
          id: r.id, sale_no: r.sale_no,
          from_branch_name: r.from_branch_name || "-",
          to_branch_name: r.to_branch_name || "-",
          sale_date: r.sale_date, status: r.status || "pending",
          item_count: r.item_count || 0, created_at: r.created_at,
          created_by_name: r.created_by_name,
        }))];
        const hasNext = Array.isArray(body) ? false : !!body?.next;
        if (!hasNext) break;
        nextPage += 1;
      }
      if (all.length === 0) { toast.warning("No data to export."); return; }

      const data = all.map((s, i) => ({
        "SR No": i + 1,
        "Sale No": s.sale_no || "-",
        "From Branch": s.from_branch_name || "-",
        "To Branch": s.to_branch_name || "-",
        Date: s.sale_date || "-",
        Status: s.status || "-",
        Items: s.item_count || 0,
        "Created By": s.created_by_name || "-",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws["!cols"] = [
        { wch: 6 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "B2B Sales List");
      XLSX.writeFile(wb, `B2B_Sales_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Exported ${all.length} records.`);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  // ── Detail open ────────────────────────────────────────────────────────
  const handleOpenDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res: any = await Get(`pos/b2b-sales/${id}/`);
      const body = res?.data ?? res;
      if (body?.success) {
        setSelected(body.data);
      } else {
        toast.error("Failed to load sale details.");
      }
    } catch {
      toast.error("Failed to load sale details.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────────
  const handleCancelSale = async (id: number) => {
    if (!confirm("Cancel this B2B Sale? Unverified items stock will be recovered.")) return;
    setCancelling(true);
    try {
      const res: any = await Post(`pos/b2b-sales/${id}/cancel/`, {});
      const body = res?.data ?? res;
      if (body?.success) {
        toast.success(body.message || "Sale cancelled.");
        setSelected(null);
        fetchPage();
      } else {
        toast.error(body?.message || "Failed to cancel sale.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error cancelling sale.");
    } finally {
      setCancelling(false);
    }
  };

  // ── Columns ────────────────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<B2BSale>[]>(() => [
    {
      id: "srNo", header: "#", size: 55,
      enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<B2BSale, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">
          {(page - 1) * pageSize + row.index + 1}
        </span>
      ),
    },
    {
      id: "sale_no", accessorKey: "sale_no", header: "Sale No",
      cell: ({ getValue, table }: CellContext<B2BSale, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return (
          <span className="whitespace-nowrap font-medium text-primary-600 dark:text-primary-400 text-xs">
            <Highlight query={q}>{String(getValue() ?? "—")}</Highlight>
          </span>
        );
      },
    },
    {
      id: "from_branch_name", accessorKey: "from_branch_name", header: "From Branch",
      cell: ({ getValue }: CellContext<B2BSale, unknown>) => (
        <span className="text-gray-700 dark:text-dark-200">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      id: "to_branch_name", accessorKey: "to_branch_name", header: "To Branch",
      cell: ({ getValue }: CellContext<B2BSale, unknown>) => (
        <span className="text-gray-700 dark:text-dark-200">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      id: "sale_date", accessorKey: "sale_date", header: "Date",
      cell: ({ getValue }: CellContext<B2BSale, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "item_count", accessorKey: "item_count", header: "Items",
      enableGlobalFilter: false,
      cell: ({ getValue }: CellContext<B2BSale, unknown>) => (
        <Badge color="neutral" variant="soft" className="text-xs">{String(getValue() ?? 0)}</Badge>
      ),
    },
    {
      id: "status", accessorKey: "status", header: "Status",
      enableGlobalFilter: false,
      cell: ({ getValue }: CellContext<B2BSale, unknown>) => {
        const v = String(getValue() ?? "");
        return (
          <Badge color={(STATUS_COLOR[v] as any) ?? "primary"} variant="soft" className="whitespace-nowrap text-xs">
            {STATUS_LABEL[v] ?? v}
          </Badge>
        );
      },
    },
    {
      id: "created_by_name", accessorKey: "created_by_name", header: "Created By",
      cell: ({ getValue }: CellContext<B2BSale, unknown>) => (
        <span className="text-gray-700 dark:text-dark-200">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      id: "actions", header: "Action",
      enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<B2BSale, unknown>) => (
        <Button isIcon variant="flat" className="size-8 rounded-full"
          title="View" onClick={() => handleOpenDetail(row.original.id)}>
          <EyeIcon className="size-4" />
        </Button>
      ),
    },
  ], [page, pageSize]);

  const table = useReactTable({
    data: sales,
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

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Page title="B2B Sales">
      <div className="transition-content w-full pb-8">
        {/* Header */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <DocumentCheckIcon className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-dark-100">B2B Sales</h1>
              <p className="text-xs text-gray-500 dark:text-dark-400">
                Showing <b>{sales.length}</b> of <b>{totalCount}</b> records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              className={clsx("h-9 gap-2 rounded-md px-3 text-sm", showFilters && "border-primary text-primary")}
              onClick={() => setShowFilters((v) => !v)}
            >
              <FunnelIcon className={clsx("size-4", showFilters && "text-primary")} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {[statusFilter?.value, startDate, endDate].filter(Boolean).length}
                </span>
              )}
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={handleExport} disabled={exporting}>
              <ArrowDownTrayIcon className="size-4 text-success-600" />
              <span>{exporting ? "Exporting..." : "Export"}</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm"
              onClick={fetchPage} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} />
              <span>Refresh</span>
            </Button>
            {canAdd && (
              <Button color="primary" className="h-9 gap-2 rounded-md px-4 text-sm"
                onClick={() => navigate("/b2b-sales/create")}>
                <PlusIcon className="size-4" />
                <span>New B2B Sale</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search + filter panel */}
        <div className="px-(--margin-x) mt-2 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search Sale No, From/To Branch…"
              classNames={{ input: "h-9 pl-9 text-sm" }}
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="size-4" />
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="px-(--margin-x) mt-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-600">
              <div className="grid gap-4 sm:grid-cols-3">
                <Combobox
                  label="Status"
                  data={STATUS_OPTIONS}
                  displayField="label"
                  searchFields={["label"]}
                  value={statusFilter}
                  onChange={(item: any) => { setStatusFilter(item); setPage(1); }}
                  placeholder="All Status"
                />
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
                    From Date
                  </label>
                  <Input type="date" value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                    classNames={{ input: "h-9 text-sm" }} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-300">
                    To Date
                  </label>
                  <Input type="date" value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                    classNames={{ input: "h-9 text-sm" }} />
                </div>
                {hasActiveFilters && (
                  <div className="sm:col-span-3">
                    <Button variant="outlined"
                      className="h-8 gap-2 rounded-md px-3 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={clearFilters}>
                      <XMarkIcon className="size-3.5" /> Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Master table */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={
            loading
              ? "Loading B2B sales…"
              : debouncedSearch || hasActiveFilters
                ? "No B2B sales match your search/filters."
                : "No B2B sales found."
          }
        />

        {/* Server-side pagination */}
        {totalCount > 0 && (
          <div className="px-(--margin-x) mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-dark-300">
              <span>
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>{" "}
                – <span className="font-medium">{Math.min(page * pageSize, totalCount)}</span>{" "}
                of <span className="font-medium">{totalCount}</span>
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              >
                {PAGE_SIZES.map((s) => (<option key={s} value={s}>{s} / page</option>))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outlined" className="h-8 px-3 text-xs"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              {Array.from({ length: Math.min(Math.max(1, totalPages), 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={clsx("size-8 rounded-lg text-xs font-medium transition-colors",
                    p === page
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-dark-200 dark:hover:bg-dark-600")}>
                  {p}
                </button>
              ))}
              <Button variant="outlined" className="h-8 px-3 text-xs"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <DetailDrawer
        sale={selected}
        onClose={() => setSelected(null)}
        onCancel={handleCancelSale}
        cancelling={cancelling}
      />

      {detailLoading && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-gray-900/40">
          <div className="size-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      )}
    </Page>
  );
}