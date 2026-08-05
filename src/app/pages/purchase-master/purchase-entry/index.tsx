import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, SortingState, useReactTable,
  ColumnDef, CellContext, RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowDownTrayIcon, ArrowPathIcon, BanknotesIcon,
  CurrencyRupeeIcon, EyeIcon, FunnelIcon,
  MagnifyingGlassIcon, PlusIcon, PrinterIcon, ReceiptRefundIcon,
  ShoppingBagIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Input, Table, THead, TBody, Tr, Th, Td } from "@/components/ui";
import { Combobox } from "@/components/shared/form/StyledCombobox";
import { Get, toasterrormsg, formatDateDDMMYYYY } from "@/ApiHelper";
import { MasterTable } from "@/app/pages/master/shared/MasterTable";
import { fuzzyFilter } from "@/utils/react-table/fuzzyFilter";
import { Highlight } from "@/components/shared/Highlight";
import { ensureString } from "@/utils/ensureString";

// ── Types ──────────────────────────────────────────────────────────────────
interface PurchaseItem {
  itemName: string;
  hsnCode: string;
  qty: string;
  price: string;
  unit: string;
  discountPercent: string;
  taxPercent: string;
  basicAmount: string;
  discountAmount: string;
  taxAmount: string;
  netAmount: string;
}

interface PurchaseRecord {
  id: number;
  billNo: string;
  purchaseBillNo: string;
  date: string;
  partyName: string;
  paymentTerms: string;
  narration: string;
  totalBasic: number;
  totalTax: number;
  grandTotal: number;
  dueDate: string | null;
  for_: number;
  items: PurchaseItem[];
}

function mapRow(raw: any): PurchaseRecord {
  const fright = Number(raw.frightcharge ?? raw.fright_charge ?? 0);
  const other  = Number(raw.otherexpnse  ?? raw.other_expense  ?? 0);
  const round  = Number(raw.roundamount  ?? raw.round_amount   ?? 0);
  return {
    id:             Number(raw.id ?? 0),
    billNo:         String(raw.bill_no ?? raw.billNo ?? ""),
    purchaseBillNo: String(raw.purchase_bill_no ?? raw.purchasebill_no ?? raw.pur_bill_no ?? ""),
    date:           String(raw.date ?? ""),
    partyName:      String(raw.party_name ?? raw.party_name_name ?? raw.vendor_name ?? ""),
    paymentTerms:   String(raw.payment_terms ?? raw.terms ?? ""),
    narration:      String(raw.narration ?? ""),
    totalBasic:     Number(raw.total_basic ?? 0),
    totalTax:       Number(raw.total_tax ?? 0),
    grandTotal:     Number(raw.grand_total ?? 0),
    dueDate:        raw.due_date ?? raw.dueDate ?? null,
    for_:           fright + other + round,
    items: Array.isArray(raw.items) ? raw.items.map((i: any) => ({
      itemName:        String(i.item_name ?? i.itemName_name ?? ""),
      hsnCode:         String(i.hsn_code ?? i.hsnCode ?? ""),
      qty:             String(i.qty ?? "0"),
      price:           String(i.price ?? "0"),
      unit:            String(i.unit ?? "pc"),
      discountPercent: String(i.discount_percent ?? i.discountPercent ?? "0"),
      taxPercent:      String(i.tax_percent ?? "0"),
      basicAmount:     String(i.basic_amount ?? i.basicAmount ?? "0"),
      discountAmount:  String(i.discount_amount ?? i.discountAmount ?? "0"),
      taxAmount:       String(i.tax_amount ?? i.taxAmount ?? "0"),
      netAmount:       String(i.net_amount ?? i.netValue ?? "0"),
    })) : [],
  };
}

// ── Items Detail Modal ─────────────────────────────────────────────────────
function ItemsModal({ record, onClose }: { record: PurchaseRecord | null; onClose: () => void }) {
  return (
    <Transition appear show={!!record} as={Fragment}>
      <Dialog as="div" className="relative z-[200]" onClose={onClose}>
        <TransitionChild as="div"
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm dark:bg-black/40"
        />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild as={DialogPanel}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-dark-700"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between bg-primary px-5 py-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Line Items — {record?.billNo}
                  </h3>
                  <p className="mt-0.5 text-xs text-white/70">
                    {record?.partyName} · {formatDateDDMMYYYY(record?.date ?? "")}
                    {record?.purchaseBillNo ? ` · PB# ${record.purchaseBillNo}` : ""}
                  </p>
                </div>
                <Button onClick={onClose} variant="flat" isIcon className="size-8 rounded-full text-white hover:bg-white/10">
                  <XMarkIcon className="size-5" />
                </Button>
              </div>

              {/* Items table */}
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <Table hoverable className="w-full text-left">
                  <THead>
                    <Tr>
                      {["SR","Item Name","HSN","Qty","Price","Per","Disc%","Basic Amt","Disc Amt","Tax Amt","Net Value"].map(h => (
                        <Th key={h} className="bg-gray-100 text-xs font-semibold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-100">{h}</Th>
                      ))}
                    </Tr>
                  </THead>
                  <TBody>
                    {!record?.items.length ? (
                      <Tr><Td colSpan={11} className="py-10 text-center text-sm text-gray-400">No items found.</Td></Tr>
                    ) : record.items.map((item, i) => (
                      <Tr key={i} className="border-b border-gray-100 dark:border-dark-600">
                        <Td className="bg-white dark:bg-dark-700 text-gray-400">{i + 1}</Td>
                        <Td className="bg-white dark:bg-dark-700 font-medium text-gray-800 dark:text-dark-100">{item.itemName || "—"}</Td>
                        <Td className="bg-white dark:bg-dark-700 font-mono text-xs text-gray-500">{item.hsnCode || "—"}</Td>
                        <Td className="bg-white dark:bg-dark-700 text-center font-semibold tabular-nums">{item.qty}</Td>
                        <Td className="bg-white dark:bg-dark-700 tabular-nums">₹{Number(item.price).toFixed(2)}</Td>
                        <Td className="bg-white dark:bg-dark-700 text-gray-500">{item.unit}</Td>
                        <Td className="bg-white dark:bg-dark-700 text-gray-500">{Number(item.discountPercent).toFixed(2)}</Td>
                        <Td className="bg-white dark:bg-dark-700 font-medium tabular-nums text-primary-600 dark:text-primary-400">₹{Number(item.basicAmount).toFixed(2)}</Td>
                        <Td className="bg-white dark:bg-dark-700 tabular-nums text-gray-500">₹{Number(item.discountAmount).toFixed(2)}</Td>
                        <Td className="bg-white dark:bg-dark-700 font-medium tabular-nums text-amber-600">₹{Number(item.taxAmount).toFixed(2)}</Td>
                        <Td className="bg-white dark:bg-dark-700 font-bold tabular-nums text-primary-600 dark:text-primary-400">₹{Number(item.netAmount).toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                  {(record?.items.length ?? 0) > 0 && (
                    <TBody>
                      <Tr className="border-t-2 border-gray-200 dark:border-dark-500">
                        <Td colSpan={7} className="bg-gray-50 dark:bg-dark-800 text-xs font-bold uppercase text-gray-600">TOTAL</Td>
                        <Td className="bg-gray-50 dark:bg-dark-800 font-bold tabular-nums text-primary-600 dark:text-primary-400">₹{record?.items.reduce((s,i)=>s+Number(i.basicAmount),0).toFixed(2)}</Td>
                        <Td className="bg-gray-50 dark:bg-dark-800 font-bold tabular-nums text-gray-500">₹{record?.items.reduce((s,i)=>s+Number(i.discountAmount),0).toFixed(2)}</Td>
                        <Td className="bg-gray-50 dark:bg-dark-800 font-bold tabular-nums text-amber-600">₹{record?.items.reduce((s,i)=>s+Number(i.taxAmount),0).toFixed(2)}</Td>
                        <Td className="bg-gray-50 dark:bg-dark-800 font-bold tabular-nums text-primary-600 dark:text-primary-400">₹{record?.items.reduce((s,i)=>s+Number(i.netAmount),0).toFixed(2)}</Td>
                      </Tr>
                    </TBody>
                  )}
                </Table>
              </div>
              <div className="flex justify-end border-t border-gray-200 px-5 py-4 dark:border-dark-600">
                <Button variant="outlined" className="px-8" onClick={onClose}>Close</Button>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function PurchaseEntryPage() {
  const navigate = useNavigate();
  const [records, setRecords]           = useState<PurchaseRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showFilter, setShowFilter]     = useState(false);
  const [filterTerms, setFilterTerms]   = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<PurchaseRecord | null>(null);

  const TERMS_OPTIONS = [
    { id: "all",    label: "All Terms" },
    { id: "Cash",   label: "Cash"      },
    { id: "Bank",   label: "Bank"      },
    { id: "Credit", label: "Credit"    },
  ];
  const [filterTermsObj, setFilterTermsObj] = useState(TERMS_OPTIONS[0]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await Get("pos/purchse-items/", { page: 1, page_size: 1000 }) as any;
      const body = res?.data ?? res;
      const rows: any[] = Array.isArray(body?.results) ? body.results
        : Array.isArray(body?.data) ? body.data
        : Array.isArray(body) ? body : [];
      setRecords(rows.map(mapRow));
    } catch { toasterrormsg("Failed to fetch purchase records."); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const filtered = useMemo(() => {
    if (filterTermsObj.id === "all") return records;
    return records.filter(r => r.paymentTerms.toLowerCase() === filterTermsObj.id.toLowerCase());
  }, [records, filterTermsObj]);

  const totals = useMemo(() => ({
    totalBasic: filtered.reduce((s, r) => s + r.totalBasic, 0),
    totalTax:   filtered.reduce((s, r) => s + r.totalTax, 0),
    for_:       filtered.reduce((s, r) => s + r.for_, 0),
    grandTotal: filtered.reduce((s, r) => s + r.grandTotal, 0),
  }), [filtered]);

  const handleExport = () => {
    const headers = ["SR","Date","Terms","Party Name","Bill No","Purchase Bill No","Due Date","Narration","Total Basic","Total Tax","F+O+R","Grand Total","Items"];
    const rows = filtered.map((r, i) => [
      i + 1, r.date, r.paymentTerms, r.partyName, r.billNo, r.purchaseBillNo,
      r.dueDate ?? "—", r.narration, r.totalBasic, r.totalTax, r.for_, r.grandTotal, r.items.length,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "purchase_register.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<PurchaseRecord>[]>(() => [
    {
      id: "srNo", header: "#", size: 55,
      enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<PurchaseRecord, unknown>) => (
        <span className="text-gray-400 dark:text-dark-400">{row.index + 1}</span>
      ),
    },
    {
      id: "date", accessorKey: "date", header: "Date",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="whitespace-nowrap text-gray-600 dark:text-dark-200">
          {formatDateDDMMYYYY(String(getValue() ?? ""))}
        </span>
      ),
    },
    {
      id: "paymentTerms", accessorKey: "paymentTerms", header: "Terms",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => {
        const v = String(getValue() ?? "");
        return <Badge color={v.toLowerCase() === "cash" ? "success" : "info"} variant="soft">{v || "—"}</Badge>;
      },
    },
    {
      id: "partyName", accessorKey: "partyName", header: "Party Name",
      cell: ({ getValue, table }: CellContext<PurchaseRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return <span className="font-medium text-gray-800 dark:text-dark-100"><Highlight query={q}>{String(getValue() ?? "—")}</Highlight></span>;
      },
    },
    {
      id: "billNo", accessorKey: "billNo", header: "Bill No",
      cell: ({ getValue, table }: CellContext<PurchaseRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return <span className="whitespace-nowrap font-medium text-primary-600 dark:text-primary-400"><Highlight query={q}>{String(getValue() ?? "—")}</Highlight></span>;
      },
    },
    {
      id: "purchaseBillNo", accessorKey: "purchaseBillNo", header: "Purchase Bill No",
      cell: ({ getValue, table }: CellContext<PurchaseRecord, unknown>) => {
        const q = ensureString(table.getState().globalFilter);
        return <span className="font-mono text-xs text-gray-600 dark:text-dark-200 whitespace-nowrap"><Highlight query={q}>{String(getValue() ?? "") || "—"}</Highlight></span>;
      },
    },
    {
      id: "dueDate", accessorKey: "dueDate", header: "Due Date",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => {
        const v = getValue();
        return <span className="whitespace-nowrap text-gray-500 dark:text-dark-300">{v ? formatDateDDMMYYYY(String(v)) : "—"}</span>;
      },
    },
    {
      id: "narration", accessorKey: "narration", header: "Narration",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="block max-w-[120px] truncate text-gray-500 dark:text-dark-300">{String(getValue() ?? "") || "—"}</span>
      ),
    },
    {
      id: "totalBasic", accessorKey: "totalBasic", header: "Total Basic",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="tabular-nums font-medium text-gray-700 dark:text-dark-200">₹{Number(getValue() ?? 0).toFixed(2)}</span>
      ),
    },
    {
      id: "totalTax", accessorKey: "totalTax", header: "Total Tax",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="tabular-nums font-medium text-amber-600 dark:text-amber-400">₹{Number(getValue() ?? 0).toFixed(2)}</span>
      ),
    },
    {
      id: "for_", accessorKey: "for_", header: "F+O+R",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="tabular-nums text-gray-500 dark:text-dark-300">₹{Number(getValue() ?? 0).toFixed(2)}</span>
      ),
    },
    {
      id: "grandTotal", accessorKey: "grandTotal", header: "Grand Total",
      cell: ({ getValue }: CellContext<PurchaseRecord, unknown>) => (
        <span className="font-bold tabular-nums text-primary-600 dark:text-primary-400">₹{Number(getValue() ?? 0).toFixed(2)}</span>
      ),
    },
    {
      id: "items", header: "Items", size: 80,
      enableSorting: false, enableGlobalFilter: false,
      cell: ({ row }: CellContext<PurchaseRecord, unknown>) => (
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-medium text-gray-700 dark:text-dark-200">{row.original.items.length}</span>
          <Button isIcon variant="flat" className="size-7 rounded-full"
            onClick={() => setSelectedRecord(row.original)} title="View Items">
            <EyeIcon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filtered, columns,
    state: { globalFilter, sorting, rowSelection },
    enableRowSelection: true,
    getRowId: row => String(row.id),
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <Page title="Purchase Entry">
      <div className="transition-content w-full pb-8">

        {/* Toolbar */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div>
            <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">Purchase Entry</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-300">
              <span className="font-semibold text-gray-800 dark:text-dark-100">{table.getFilteredRowModel().rows.length}</span>{" "}records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={() => setShowFilter(v => !v)}>
              <FunnelIcon className={clsx("size-4", showFilter && "text-primary")} />
              <span>Filters</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={handleExport}>
              <ArrowDownTrayIcon className="size-4 text-success-600" /><span>Export Excel</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={() => window.print()}>
              <PrinterIcon className="size-4" /><span>Print</span>
            </Button>
            <Button variant="outlined" className="h-9 gap-2 rounded-md px-3 text-sm" onClick={fetchRecords} disabled={loading}>
              <ArrowPathIcon className={clsx("size-4", loading && "animate-spin")} /><span>Refresh</span>
            </Button>
            <Button color="primary" className="h-9 gap-2 rounded-md px-4 text-sm"
              onClick={() => navigate("/pos/purchase/purchase-entry/new")}>
              <PlusIcon className="size-4" /><span>Add Purchase</span>
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="px-(--margin-x) mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Basic", value: totals.totalBasic, bg: "from-primary-500 to-primary-700",  Icon: ShoppingBagIcon },
            { label: "Total Tax",   value: totals.totalTax,   bg: "from-amber-500 to-amber-600",       Icon: ReceiptRefundIcon },
            { label: "F + O + R",   value: totals.for_,       bg: "from-purple-500 to-purple-700",     Icon: CurrencyRupeeIcon },
            { label: "Grand Total", value: totals.grandTotal, bg: "from-emerald-500 to-emerald-700",   Icon: BanknotesIcon },
          ].map(({ label, value, bg, Icon }) => (
            <div key={label} className={clsx("relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-md", bg)}>
              <div className="pointer-events-none absolute -right-2 -top-2 size-14 rounded-full bg-white/10" />
              <div className="mb-2 grid size-8 place-items-center rounded-lg bg-white/20">
                <Icon className="size-4 text-white" />
              </div>
              <p className="text-xl font-bold tabular-nums">₹{value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs font-medium text-white/80">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="px-(--margin-x) mt-4 max-w-sm">
          <Input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
            classNames={{ input: "h-9 text-sm focus:ring-3 ring-primary-500/50" }}
            placeholder="Search Bill No, Party, Purchase Bill No…"
          />
        </div>

        {/* Filter panel */}
        {showFilter && (
          <div className="px-(--margin-x) mt-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-500 dark:bg-dark-600">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <Combobox
                  label="Payment Terms"
                  data={TERMS_OPTIONS}
                  displayField="label"
                  searchFields={["label"]}
                  value={filterTermsObj}
                  onChange={(item: any) => setFilterTermsObj(item ?? TERMS_OPTIONS[0])}
                  placeholder="All Terms"
                />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <MasterTable
          table={table}
          columnCount={columns.length}
          emptyMessage={loading ? "Loading purchase records…" : "No purchase records found."}
        />
      </div>

      <ItemsModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </Page>
  );
}
