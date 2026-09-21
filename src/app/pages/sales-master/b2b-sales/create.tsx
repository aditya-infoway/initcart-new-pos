// src/pages/b2bsales/create.tsx
// B2B SALES — Create page with HOLD / HOLD LIST / RESUME feature
// Storage: localStorage key "b2b_sales_holds"

import {
  Dialog, DialogPanel, Transition, TransitionChild,
} from "@headlessui/react";
import {
  ArrowLeftIcon, CheckCircleIcon, CubeIcon,
  MagnifyingGlassIcon, TrashIcon, XMarkIcon,
  DocumentCheckIcon, BuildingOfficeIcon, QrCodeIcon,
  InformationCircleIcon, PauseIcon, PlayIcon, ClockIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { Page } from "@/components/shared/Page";
import { Badge, Button, Card, Input, Table, THead, TBody, Tr, Th, Td, Textarea } from "@/components/ui";
import { DatePicker } from "@/components/shared/form/DatePicker";
import { Combobox } from "@/components/shared/form/StyledCombobox";
import { Get, Post, toasterrormsg, toastsuccessmsg } from "@/ApiHelper";

// ═══════════════════════════════════════════════════════════════════════════
// HOLD STORAGE
// ═══════════════════════════════════════════════════════════════════════════
interface HeldSale {
  holdId: string;
  heldAt: string;
  saleDate: string;
  toBranchId: number;
  toBranchName: string;
  note: string;
  cart: CartRow[];
}

const HOLDS_STORAGE_KEY = "b2b_sales_holds";

const loadHolds = (): HeldSale[] => {
  try {
    const raw = localStorage.getItem(HOLDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const saveHolds = (holds: HeldSale[]) => {
  try { localStorage.setItem(HOLDS_STORAGE_KEY, JSON.stringify(holds)); }
  catch (e) { console.error("Failed to save holds", e); }
};

// ── Types ──────────────────────────────────────────────────────────────────
interface FranchiseBranch {
  id: number;
  branch_name: string;
  city: string;
  state: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  pincode?: string;
}

interface VariantOption {
  variant_id: number;
  variant_label: string;
  size: string | null;
  color: string | null;
  barcode: string | null;
  branch_price: number;
  current_stock: number;
  hsnCode?: string;
  taxSlab?: string;
  display?: string;
}

interface SourceItem {
  item_id: number;
  item_name: string;
  hsnCode?: string;
  taxSlab?: string;
  unit?: string;
  unit_name?: string;
  variants: VariantOption[];
}

interface CartRow {
  id: number;
  variantId: number;
  itemName: string;
  hsnCode: string;
  barcode: string;
  unit: string;
  quantity: number;
  rate: number;
  taxSlab: string;
  basicAmount: number;
  taxAmount: number;
  netValue: number;
  cgst: number;
  sgst: number;
  igst: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const safeNum = (val: any): number => {
  if (val === null || val === undefined || val === "") return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
};
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">{label}</label>
      <div className="flex h-9 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-200">
        {value || "—"}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
      <Icon className="size-4" /> {title}
    </div>
  );
}

function BranchDetailsCard({ branch }: { branch: FranchiseBranch }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BuildingOfficeIcon className="size-5 text-primary" />
        <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100">Destination Branch Details</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500 dark:text-dark-400">Branch Name</p>
          <p className="font-semibold text-gray-800 dark:text-dark-100">{branch.branch_name || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-dark-400">Owner</p>
          <p className="font-medium text-gray-700 dark:text-dark-200">{branch.owner_name || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-dark-400">Phone</p>
          <p className="font-medium text-gray-700 dark:text-dark-200">{branch.phone || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-dark-400">Email</p>
          <p className="font-medium text-gray-700 dark:text-dark-200 truncate">{branch.email || "-"}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="text-xs text-gray-500 dark:text-dark-400">Address</p>
          <p className="font-medium text-gray-700 dark:text-dark-200">{branch.address || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-dark-400">City</p>
          <p className="font-medium text-gray-700 dark:text-dark-200">{branch.city || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-dark-400">State</p>
          <p className="font-medium text-gray-700 dark:text-dark-200">{branch.state || "-"} {branch.pincode ? `— ${branch.pincode}` : ""}</p>
        </div>
      </div>
    </div>
  );
}

// ── Item Pick Modal ────────────────────────────────────────────────────────
function ItemPickModal({
  isOpen, onClose, onPick, toBranchId, addedVariantIds,
}: {
  isOpen: boolean; onClose: () => void;
  onPick: (item: SourceItem, variant: VariantOption) => void;
  toBranchId: number;
  addedVariantIds: Set<number>;
}) {
  const [query, setQuery] = useState("");
  const [dq, setDq] = useState("");
  const [items, setItems] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDq(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async (p = 1) => {
    if (!toBranchId) return;
    setLoading(true);
    try {
      const params: any = { page: p, page_size: 50 };
      if (dq) params.search = dq;
      const res = await Get("pos/b2b-sales/my-branch-items/", params) as any;
      let rows: SourceItem[] = [];
      if (res?.data?.results?.success) rows = res.data.results.data || [];
      else if (res?.data?.success) rows = res.data.data || [];
      else if (Array.isArray(res?.data)) rows = res.data;
      setItems(rows);
      const body = res?.data ?? res;
      setTotal(body?.count ?? rows.length);
      setHasNext(!!body?.next);
      setPage(p);
    } catch { toasterrormsg("Could not load items."); }
    finally { setLoading(false); }
  }, [dq, toBranchId]);

  useEffect(() => { if (isOpen) { setQuery(""); load(1); } }, [isOpen, load]);
  useEffect(() => { if (isOpen) load(1); }, [dq, load]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[210]" onClose={onClose}>
        <TransitionChild as="div"
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm dark:bg-black/50"
        />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild as={DialogPanel}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-700"
            >
              <div className="flex items-center justify-between bg-primary px-5 py-4">
                <div>
                  <h3 className="text-base font-bold text-white">Select Item Variant</h3>
                  <p className="mt-0.5 text-xs text-white/70">{total} items available</p>
                </div>
                <Button onClick={onClose} variant="flat" isIcon className="size-8 rounded-full text-white hover:bg-white/10">
                  <XMarkIcon className="size-5" />
                </Button>
              </div>
              <div className="border-b border-gray-200 px-5 py-3 dark:border-dark-500">
                <Input value={query} onChange={e => setQuery(e.target.value)}
                  prefix={<MagnifyingGlassIcon className="size-4" />}
                  placeholder="Search item, barcode, size, color…"
                  classNames={{ input: "h-9 text-sm" }} autoFocus
                />
              </div>
              <div className="max-h-[55vh] overflow-y-auto overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-16 text-center text-sm text-gray-400 dark:text-dark-400">No items available.</div>
                ) : (
                  <div className="min-w-full overflow-x-auto">
                    <Table hoverable className="w-full text-left">
                      <THead>
                        <Tr>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Action</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Item Name</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Variant</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Size</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Color</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Barcode</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">HSN</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">GST%</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Price ₹</Th>
                          <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Stock</Th>
                        </Tr>
                      </THead>
                      <TBody>
                        {items.flatMap(item => item.variants.map(variant => {
                          const inCart = addedVariantIds.has(variant.variant_id);
                          return (
                            <Tr key={`${item.item_id}-${variant.variant_id}`} className={clsx("dark:border-b-dark-500 border-b border-gray-100", inCart && "opacity-40")}>
                              <Td className="bg-white dark:bg-dark-900">
                                {inCart ? (
                                  <Badge color="primary" variant="soft" className="text-xs font-semibold">✓ Added</Badge>
                                ) : (
                                  <Button color="primary" className="h-7 rounded-md px-3 text-xs"
                                    onClick={() => { onPick(item, variant); onClose(); }}>
                                    Select
                                  </Button>
                                )}
                              </Td>
                              <Td className="bg-white dark:bg-dark-900 font-medium text-gray-800 dark:text-dark-100">{item.item_name}</Td>
                              <Td className="bg-white dark:bg-dark-900"><Badge color="info" variant="soft" className="text-xs">{variant.variant_label}</Badge></Td>
                              <Td className="bg-white dark:bg-dark-900 text-gray-600 dark:text-dark-200">{variant.size || "—"}</Td>
                              <Td className="bg-white dark:bg-dark-900 text-gray-600 dark:text-dark-200">{variant.color || "—"}</Td>
                              <Td className="bg-white dark:bg-dark-900 text-xs text-gray-500 dark:text-dark-300">{variant.barcode || "—"}</Td>
                              <Td className="bg-white dark:bg-dark-900 text-xs text-gray-500 dark:text-dark-300">{variant.hsnCode || item.hsnCode || "—"}</Td>
                              <Td className="bg-white dark:bg-dark-900 text-center">
                                <Badge color="info" variant="soft" className="text-xs">{variant.taxSlab || item.taxSlab || "0%"}</Badge>
                              </Td>
                              <Td className="bg-white dark:bg-dark-900 tabular-nums text-gray-700 dark:text-dark-200">₹{variant.branch_price}</Td>
                              <Td className="bg-white dark:bg-dark-900 text-center">
                                <Badge color={variant.current_stock > 0 ? "success" : "error"} variant="soft" className="text-xs font-semibold">
                                  {variant.current_stock}
                                </Badge>
                              </Td>
                            </Tr>
                          );
                        }))}
                      </TBody>
                    </Table>
                  </div>
                )}
              </div>
              {total > 50 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-dark-500 text-sm text-gray-500 dark:text-dark-400">
                  <span>{total} items</span>
                  <div className="flex gap-2">
                    <Button variant="outlined" className="h-7 px-3 text-xs" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</Button>
                    <Button variant="outlined" className="h-7 px-3 text-xs" disabled={!hasNext} onClick={() => load(page + 1)}>Next</Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end border-t border-gray-200 px-5 py-3 dark:border-dark-500">
                <Button variant="outlined" className="px-6" onClick={onClose}>Close</Button>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Hold List Modal ────────────────────────────────────────────────────────
function HoldListModal({
  isOpen, holds, onClose, onResume, onDelete, formatTime,
}: {
  isOpen: boolean;
  holds: HeldSale[];
  onClose: () => void;
  onResume: (h: HeldSale) => void;
  onDelete: (holdId: string) => void;
  formatTime: (iso: string) => string;
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[210]" onClose={onClose}>
        <TransitionChild as="div"
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm dark:bg-black/50" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild as={DialogPanel}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-700">
              <div className="flex items-center justify-between bg-primary px-5 py-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ClipboardDocumentListIcon className="size-5" /> Held Sales ({holds.length})
                  </h3>
                  <p className="mt-0.5 text-xs text-white/70">Resume a draft or delete it</p>
                </div>
                <Button onClick={onClose} variant="flat" isIcon className="size-8 rounded-full text-white hover:bg-white/10">
                  <XMarkIcon className="size-5" />
                </Button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto p-5">
                {holds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-dark-400">
                    <PauseIcon className="mb-3 size-12 text-gray-200 dark:text-dark-600" />
                    <p className="text-base">No held sales yet</p>
                    <p className="mt-1 text-xs">Add items and click <b>Hold</b> to save a draft</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {holds.map(h => (
                      <div key={h.holdId}
                        className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-primary/40 hover:shadow-md dark:border-dark-500 dark:bg-dark-800">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-[200px] flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <BuildingOfficeIcon className="size-4 text-primary-500" />
                              <span className="font-semibold text-gray-800 dark:text-dark-100">{h.toBranchName}</span>
                              <Badge color="info" variant="soft" className="text-xs">
                                {h.cart.length} item{h.cart.length > 1 ? "s" : ""}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-dark-300">
                              <span className="flex items-center gap-1">
                                <ClockIcon className="size-3" /> {formatTime(h.heldAt)}
                              </span>
                              <span>Date: {h.saleDate}</span>
                              {h.note && <span className="max-w-[200px] truncate italic">"{h.note}"</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button color="primary" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => onResume(h)}>
                              <PlayIcon className="size-3.5" /> Resume
                            </Button>
                            <Button isIcon variant="flat" className="size-8 rounded-full text-error-500 hover:bg-error-50"
                              onClick={() => onDelete(h.holdId)} title="Delete hold">
                              <TrashIcon className="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-200 pt-3 dark:border-dark-600">
                          {h.cart.slice(0, 5).map((it, i) => (
                            <span key={i} className="rounded border border-gray-200 bg-white px-2 py-0.5 text-[11px] text-gray-600 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200">
                              {it.itemName} × {it.quantity}
                            </span>
                          ))}
                          {h.cart.length > 5 && (
                            <span className="px-2 py-0.5 text-[11px] text-gray-500 dark:text-dark-400">
                              +{h.cart.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-gray-200 px-5 py-3 dark:border-dark-500">
                <Button variant="outlined" className="px-6" onClick={onClose}>Close</Button>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── Inline Barcode Scanner (compact, used inside Items Table header) ──────
function InlineBarcodeScanner({
  flatItems, toBranchId, onItemSelected, onNeedParent,
}: {
  flatItems: VariantOption[];
  toBranchId: number;
  onItemSelected: (variant: VariantOption) => void;
  onNeedParent: (variant: VariantOption) => void;
}) {
  const [barcodeValue, setBarcodeValue] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleBarcodeSearch = async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;

    if (!toBranchId) {
      toasterrormsg("Please select destination (franchise) branch first");
      setBarcodeValue("");
      return;
    }

    setScanning(true);
    try {
      const localMatch = flatItems.find(
        (item) => item.barcode && item.barcode.toLowerCase() === trimmed.toLowerCase()
      );

      if (localMatch) {
        if (localMatch.current_stock <= 0) toasterrormsg(`Item is out of stock`);
        else { onNeedParent(localMatch); toastsuccessmsg(`✓ Item selected`); }
        setBarcodeValue(""); setScanning(false); return;
      }

      const res = await Get("pos/b2b-sales/my-branch-items/", { search: trimmed }) as any;
      let items: SourceItem[] = [];
      if (res?.data?.results?.success) items = res.data.results.data || [];
      else if (res?.data?.success) items = res.data.data || [];
      else if (Array.isArray(res?.data)) items = res.data;

      const allVariants: VariantOption[] = items.flatMap(item => item.variants);
      const apiMatch = allVariants.find(
        (item) => item.barcode && item.barcode.toLowerCase() === trimmed.toLowerCase()
      );

      if (!apiMatch) toasterrormsg(`No item found with barcode "${trimmed}"`);
      else if (apiMatch.current_stock <= 0) toasterrormsg(`Item is out of stock`);
      else { onNeedParent(apiMatch); toastsuccessmsg(`✓ Item selected`); }
    } catch (err) {
      toasterrormsg("Barcode search failed. Please try again.");
    } finally {
      setBarcodeValue(""); setScanning(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        value={barcodeValue}
        onChange={e => setBarcodeValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeSearch(barcodeValue); } }}
        placeholder="Scan barcode..."
        disabled={scanning}
        prefix={<QrCodeIcon className="size-4" />}
        classNames={{ input: "h-9 w-56 text-sm" }}
      />
      {scanning && (
        <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function CreateB2BSalesPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [saleNo, setSaleNo] = useState("Loading…");
  const [saleDate, setSaleDate] = useState(today);
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  const [branches, setBranches] = useState<FranchiseBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [branchDetails, setBranchDetails] = useState<FranchiseBranch | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [cart, setCart] = useState<CartRow[]>([]);
  const [idCounter, setIdCounter] = useState(1);

  const [flatItems, setFlatItems] = useState<VariantOption[]>([]);

  // ── HOLD state ──
  const [holds, setHolds] = useState<HeldSale[]>([]);
  const [showHoldListModal, setShowHoldListModal] = useState(false);

  const [currentItem, setCurrentItem] = useState({
    variantId: 0, itemName: "", hsnCode: "", barcode: "", unit: "",
    quantity: "", rate: 0, taxSlab: "", availableStock: 0,
    basicAmount: "0.00", taxAmount: "0.00", netValue: "0.00",
    cgst: "0.00", sgst: "0.00", igst: "0.00",
  });
  const [currentItemErrors, setCurrentItemErrors] = useState<Record<string, string>>({});

  // ── Load holds on mount ──
  useEffect(() => { setHolds(loadHolds()); }, []);

  // ── Load next sale number ──
  useEffect(() => {
    Get("pos/b2b-sales/next-number/")
      .then((res: any) => { if (res?.data?.success) setSaleNo(res.data.sale_no); })
      .catch(() => setSaleNo("—"));
  }, []);

  // ── Load franchise branches ──
  useEffect(() => {
    setBranchesLoading(true);
    Get("pos/b2b-sales/franchise-branches/")
      .then((res: any) => { setBranches(res?.data?.data || []); })
      .catch(() => toasterrormsg("Failed to load franchise branches"))
      .finally(() => setBranchesLoading(false));
  }, []);

  // ── Load items for barcode scanner ──
  useEffect(() => {
    Get("pos/b2b-sales/my-branch-items/")
      .then((res: any) => {
        let items: SourceItem[] = [];
        if (res?.data?.results?.success) items = res.data.results.data || [];
        else if (res?.data?.success) items = res.data.data || [];
        else if (Array.isArray(res?.data)) items = res.data;
        setFlatItems(items.flatMap(item => item.variants));
      })
      .catch(() => toasterrormsg("Failed to load items"));
  }, []);

  // ── Branch details sync ──
  useEffect(() => {
    if (selectedBranch) {
      setBranchDetails(branches.find(b => b.id === selectedBranch.value) || null);
    } else {
      setBranchDetails(null);
    }
  }, [selectedBranch, branches]);

  // ── Tax calculation ──
  useEffect(() => {
    if (!currentItem.variantId || !selectedBranch?.value || !currentItem.quantity) {
      setCurrentItem(prev => ({
        ...prev, basicAmount: "0.00", taxAmount: "0.00", netValue: "0.00",
        cgst: "0.00", sgst: "0.00", igst: "0.00",
      }));
      return;
    }
    const calcTax = async () => {
      try {
        const res = await Post("pos/b2b-sales/item-tax/", {
          from_variant_id: currentItem.variantId,
          to_branch_id: selectedBranch.value,
          quantity: Number(currentItem.quantity) || 0,
        }) as any;
        const d = res?.data;
        setCurrentItem(prev => ({
          ...prev,
          rate: d?.rate || 0,
          basicAmount: d?.basic_amount?.toFixed(2) || "0.00",
          taxAmount: d?.tax_amount?.toFixed(2) || "0.00",
          netValue: d?.net_amount?.toFixed(2) || "0.00",
          cgst: d?.cgst?.toFixed(2) || "0.00",
          sgst: d?.sgst?.toFixed(2) || "0.00",
          igst: d?.igst?.toFixed(2) || "0.00",
        }));
      } catch (e) { console.error("Tax calculation failed", e); }
    };
    calcTax();
  }, [currentItem.variantId, currentItem.quantity, selectedBranch?.value]);

  const branchOptions = useMemo(() =>
    branches.map(b => ({ value: b.id, label: `${b.branch_name}${b.city ? ` — ${b.city}` : ""}` })),
    [branches]
  );

  const totals = useMemo(() => {
    const totalBasic = cart.reduce((s, it) => s + safeNum(it.basicAmount), 0);
    const totalTax = cart.reduce((s, it) => s + safeNum(it.taxAmount), 0);
    const totalNet = cart.reduce((s, it) => s + safeNum(it.netValue), 0);
    const totalCgst = cart.reduce((s, it) => s + safeNum(it.cgst), 0);
    const totalSgst = cart.reduce((s, it) => s + safeNum(it.sgst), 0);
    const totalIgst = cart.reduce((s, it) => s + safeNum(it.igst), 0);
    return {
      totalBasic: round2(totalBasic), totalTax: round2(totalTax), totalNet: round2(totalNet),
      totalCgst: round2(totalCgst), totalSgst: round2(totalSgst), totalIgst: round2(totalIgst),
    };
  }, [cart]);

  const applyItemToForm = (item: SourceItem, variant: VariantOption) => {
    setCurrentItem({
      variantId: variant.variant_id,
      itemName: item.item_name,
      hsnCode: item.hsnCode || "",
      barcode: variant.barcode || "",
      unit: item.unit || "pc",
      quantity: "1",
      rate: variant.branch_price,
      taxSlab: variant.taxSlab || item.taxSlab || "0",
      availableStock: variant.current_stock,
      basicAmount: "0.00", taxAmount: "0.00", netValue: "0.00",
      cgst: "0.00", sgst: "0.00", igst: "0.00",
    });
    setCurrentItemErrors({});
  };

  // Barcode scanner handler — find parent item and apply
  const handleBarcodeVariant = (variant: VariantOption) => {
    Get("pos/b2b-sales/my-branch-items/")
      .then((res: any) => {
        let items: SourceItem[] = [];
        if (res?.data?.results?.success) items = res.data.results.data || [];
        else if (res?.data?.success) items = res.data.data || [];
        else if (Array.isArray(res?.data)) items = res.data;
        const parentItem = items.find(item => item.variants.some(v => v.variant_id === variant.variant_id));
        if (parentItem) applyItemToForm(parentItem, variant);
      });
  };

  const handleAddItem = () => {
    const errors: Record<string, string> = {};
    if (!selectedBranch?.value) { toasterrormsg("Please select destination branch first"); return; }
    if (!currentItem.variantId) errors.variantId = "Please select an item";
    if (!currentItem.quantity || Number(currentItem.quantity) <= 0) errors.quantity = "Please enter valid quantity";
    if (Number(currentItem.quantity) > currentItem.availableStock) errors.quantity = `Max available: ${currentItem.availableStock}`;

    if (Object.keys(errors).length > 0) { setCurrentItemErrors(errors); return; }
    setCurrentItemErrors({});

    setCart(prev => [
      ...prev,
      {
        id: idCounter,
        variantId: currentItem.variantId,
        itemName: currentItem.itemName,
        hsnCode: currentItem.hsnCode,
        barcode: currentItem.barcode,
        unit: currentItem.unit,
        quantity: Number(currentItem.quantity),
        rate: currentItem.rate,
        taxSlab: currentItem.taxSlab,
        basicAmount: Number(currentItem.basicAmount),
        taxAmount: Number(currentItem.taxAmount),
        netValue: Number(currentItem.netValue),
        cgst: Number(currentItem.cgst),
        sgst: Number(currentItem.sgst),
        igst: Number(currentItem.igst),
      },
    ]);
    setIdCounter(p => p + 1);
    setCurrentItem({
      variantId: 0, itemName: "", hsnCode: "", barcode: "", unit: "",
      quantity: "", rate: 0, taxSlab: "", availableStock: 0,
      basicAmount: "0.00", taxAmount: "0.00", netValue: "0.00",
      cgst: "0.00", sgst: "0.00", igst: "0.00",
    });
    setCurrentItemErrors({});
    toastsuccessmsg("Item added successfully!");
  };

  const handleDeleteItem = (id: number) => setCart(prev => prev.filter(item => item.id !== id));
  const handleClearAll = () => { setCart([]); setIdCounter(1); };

  // ═══════════════════════════════════════════════════════════════════════
  // HOLD HANDLERS
  // ═══════════════════════════════════════════════════════════════════════
  const handleHold = () => {
    if (!selectedBranch?.value) { toasterrormsg("Select destination branch before holding"); return; }
    if (cart.length === 0) { toasterrormsg("Add at least one item before holding"); return; }

    const newHold: HeldSale = {
      holdId: `HOLD-${Date.now()}`,
      heldAt: new Date().toISOString(),
      saleDate,
      toBranchId: selectedBranch.value,
      toBranchName: selectedBranch.label,
      note: note || "",
      cart,
    };

    const updated = [newHold, ...holds];
    setHolds(updated);
    saveHolds(updated);

    // Reset form
    setCart([]);
    setIdCounter(1);
    setNote("");
    setSelectedBranch(null);
    setCurrentItem({
      variantId: 0, itemName: "", hsnCode: "", barcode: "", unit: "",
      quantity: "", rate: 0, taxSlab: "", availableStock: 0,
      basicAmount: "0.00", taxAmount: "0.00", netValue: "0.00",
      cgst: "0.00", sgst: "0.00", igst: "0.00",
    });
    setCurrentItemErrors({});

    toastsuccessmsg("Sale held successfully! Find it in Hold List.");
    setShowHoldListModal(true);
  };

  const handleResumeHold = (hold: HeldSale) => {
    const branchOpt = branchOptions.find(b => b.value === hold.toBranchId);
    if (branchOpt) setSelectedBranch(branchOpt);

    setSaleDate(hold.saleDate);
    setNote(hold.note || "");
    const restored = hold.cart.map((it, idx) => ({ ...it, id: idx + 1 }));
    setCart(restored);
    setIdCounter(restored.length + 1);

    const updated = holds.filter(h => h.holdId !== hold.holdId);
    setHolds(updated);
    saveHolds(updated);

    setShowHoldListModal(false);
    toastsuccessmsg("Held sale resumed!");
  };

  const handleDeleteHold = (holdId: string) => {
    const updated = holds.filter(h => h.holdId !== holdId);
    setHolds(updated);
    saveHolds(updated);
    toastsuccessmsg("Hold removed");
  };

  const formatHoldTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (cart.length === 0) { toasterrormsg("At least one item is required"); return; }
    if (!selectedBranch?.value) { toasterrormsg("Select destination franchise branch"); return; }

    const payload = {
      to_branch_id: selectedBranch.value,
      sale_date: saleDate,
      note: note || "",
      items: cart.map(it => ({
        from_variant_id: it.variantId,
        quantity: it.quantity,
        rate: it.rate,
      })),
    };

    setCreating(true);
    try {
      const res = await Post("pos/b2b-sales/", payload) as any;
      if (res?.data?.success) {
        toastsuccessmsg(res.data.message || "B2B Sale created successfully");
        navigate("/b2bsales");
      } else {
        toasterrormsg(res?.data?.message || "Error while saving B2B sale");
      }
    } catch (error: any) {
      const errs = error?.response?.data?.errors;
      const msg = Array.isArray(errs) ? errs.join(", ") : (error?.response?.data?.message || "Error while saving B2B sale");
      toasterrormsg(msg);
    } finally {
      setCreating(false);
    }
  };

  const addedVariantIds = useMemo(() => new Set(cart.map(c => c.variantId)), [cart]);

  return (
    <Page title="Create B2B Sale">
      <div className="transition-content w-full pb-8 space-y-4">
        {/* Header */}
        <div className="px-(--margin-x) flex flex-wrap items-center justify-between gap-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Button variant="outlined" className="h-8 gap-2 rounded-md px-3 text-sm" onClick={() => navigate("/b2bsales")}>
              <ArrowLeftIcon className="size-4" /> Back to Sales
            </Button>
            <div>
              <h2 className="text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">Create B2B Sale</h2>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">Superadmin → Franchise branch stock transfer</p>
            </div>
          </div>
          {/* ── HOLD LIST button (header) ── */}
          <Button variant="outlined" className="relative h-8 gap-2 rounded-md px-3 text-sm"
            onClick={() => setShowHoldListModal(true)}>
            <ClipboardDocumentListIcon className="size-4" /> Hold List
            {holds.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                {holds.length}
              </span>
            )}
          </Button>
        </div>

        {/* Sale Details */}
        <div className="px-(--margin-x)">
          <Card skin="bordered" className="p-4">
            <SectionHeader icon={DocumentCheckIcon} title="Sale Details" />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">Sale Date</label>
                <DatePicker value={saleDate} onChange={setSaleDate} className="h-9 w-full" />
              </div>
              <ReadField label="Sale No." value={saleNo} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">To Branch (Franchise)</label>
                <Combobox data={branchOptions} displayField="label" searchFields={["label"]}
                  value={selectedBranch} onChange={setSelectedBranch} placeholder="Select Franchise Branch" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">Note</label>
                <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes..." rows={1} className="h-9" />
              </div>
            </div>
          </Card>
        </div>

        {/* Branch Details */}
        {branchDetails && (
          <div className="px-(--margin-x)"><BranchDetailsCard branch={branchDetails} /></div>
        )}

        {/* Item Entry */}
        <div className="px-(--margin-x)">
          <Card skin="bordered" className="p-4">
            <SectionHeader icon={CubeIcon} title="Item Entry" />
            {currentItem.itemName && (
              <div className="mt-2 text-sm text-success-600 dark:text-success-400">
                — {currentItem.itemName} (Stock: {currentItem.availableStock})
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 items-end">
              <div className="lg:col-span-1">
                <Button color="primary" className="w-full h-9" disabled={!selectedBranch?.value}
                  onClick={() => setModalOpen(true)}>
                  <MagnifyingGlassIcon className="size-4" /> Select Item
                </Button>
                {currentItemErrors.variantId && <p className="text-xs text-error-600 mt-1">{currentItemErrors.variantId}</p>}
              </div>
              <ReadField label="HSN" value={currentItem.hsnCode} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">Qty</label>
                <Input type="number" value={currentItem.quantity}
                  onChange={e => {
                    setCurrentItem(prev => ({ ...prev, quantity: e.target.value }));
                    if (currentItemErrors.quantity) setCurrentItemErrors(prev => { const n = { ...prev }; delete n.quantity; return n; });
                  }}
                  placeholder="0"
                  className={clsx("h-9", currentItemErrors.quantity && "border-error-500")} />
                {currentItemErrors.quantity && <p className="text-xs text-error-600 mt-1">{currentItemErrors.quantity}</p>}
              </div>
              <ReadField label="Rate" value={`₹${currentItem.rate.toFixed(2)}`} />
              <ReadField label="Unit" value={currentItem.unit} />
              <ReadField label="Tax%" value={`${currentItem.taxSlab}%`} />
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-dark-200">Net</label>
                <div className="flex h-9 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm font-bold text-primary-600 dark:border-dark-500 dark:bg-dark-800 dark:text-primary-400">
                  {currentItem.netValue}
                </div>
              </div>
              <Button color="primary" className="h-9" onClick={handleAddItem}>
                <CheckCircleIcon className="size-4" /> Add
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Items Table (barcode scanner INLINE in header) ── */}
        <div className="px-(--margin-x)">
          <Card skin="bordered" className="overflow-hidden">
            {/* Header with barcode scanner */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-500 dark:bg-dark-800">
              <div className="flex items-center gap-2">
                <CubeIcon className="size-4 text-primary-500" />
                <span className="text-sm font-bold text-gray-800 dark:text-dark-100">Items</span>
                {cart.length > 0 && <Badge color="primary" className="text-xs font-bold">{cart.length}</Badge>}
              </div>
              <InlineBarcodeScanner
                flatItems={flatItems}
                toBranchId={selectedBranch?.value || 0}
                onItemSelected={applyItemToForm as any}
                onNeedParent={handleBarcodeVariant}
              />
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              <Table hoverable className="w-full text-left">
                <THead className="sticky top-0 z-10">
                  <Tr>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">#</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Item</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">HSN</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Qty</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Rate</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Unit</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Tax%</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Basic</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Tax Amt</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Net</Th>
                    <Th className="dark:bg-dark-800 dark:text-dark-100 bg-gray-100 font-semibold text-gray-700 uppercase tracking-wide text-xs whitespace-nowrap">Action</Th>
                  </Tr>
                </THead>
                <TBody>
                  {cart.length === 0 ? (
                    <Tr>
                      <Td colSpan={11} className="text-center py-10 text-sm text-gray-400 dark:text-dark-400">
                        <CubeIcon className="mx-auto mb-2 size-8 opacity-30" />
                        No items added yet
                      </Td>
                    </Tr>
                  ) : cart.map((item, idx) => (
                    <Tr key={item.id} className="dark:border-b-dark-500 border-b border-gray-100">
                      <Td className="bg-white dark:bg-dark-900 text-gray-400">{idx + 1}</Td>
                      <Td className="bg-white dark:bg-dark-900 font-medium text-gray-800 dark:text-dark-100">{item.itemName}</Td>
                      <Td className="bg-white dark:bg-dark-900 text-xs text-gray-500 dark:text-dark-300">{item.hsnCode}</Td>
                      <Td className="bg-white dark:bg-dark-900">{item.quantity}</Td>
                      <Td className="bg-white dark:bg-dark-900">₹{item.rate.toFixed(2)}</Td>
                      <Td className="bg-white dark:bg-dark-900">{item.unit}</Td>
                      <Td className="bg-white dark:bg-dark-900">{item.taxSlab}%</Td>
                      <Td className="bg-white dark:bg-dark-900">₹{item.basicAmount.toFixed(2)}</Td>
                      <Td className="bg-white dark:bg-dark-900">₹{item.taxAmount.toFixed(2)}</Td>
                      <Td className="bg-white dark:bg-dark-900 font-bold">₹{item.netValue.toFixed(2)}</Td>
                      <Td className="bg-white dark:bg-dark-900">
                        <Button isIcon variant="flat" className="size-8 rounded-full" onClick={() => handleDeleteItem(item.id)}>
                          <TrashIcon className="size-4 text-error-600" />
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
            {cart.length > 0 && (
              <div className="border-t border-gray-200 dark:border-dark-500 bg-gray-50 dark:bg-dark-800 px-4 py-2 flex justify-end gap-4 text-sm font-semibold">
                <span>Total Basic: ₹{totals.totalBasic.toFixed(2)}</span>
                <span>Total Tax: ₹{totals.totalTax.toFixed(2)}</span>
                <span className="text-primary-600 dark:text-primary-400">Total Net: ₹{totals.totalNet.toFixed(2)}</span>
              </div>
            )}
          </Card>
        </div>

        {/* GST Summary */}
        {cart.length > 0 && (
          <div className="px-(--margin-x)">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <InformationCircleIcon className="size-5 text-primary" />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100">GST Summary</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-primary/10">
                  <span className="text-gray-600 dark:text-dark-400">Total Basic Amount</span>
                  <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.totalBasic.toFixed(2)}</span>
                </div>
                {totals.totalCgst > 0 || totals.totalSgst > 0 ? (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-primary/10">
                      <span className="text-gray-600 dark:text-dark-400">CGST</span>
                      <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.totalCgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-primary/10">
                      <span className="text-gray-600 dark:text-dark-400">SGST</span>
                      <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.totalSgst.toFixed(2)}</span>
                    </div>
                  </>
                ) : totals.totalIgst > 0 ? (
                  <div className="flex justify-between py-1.5 border-b border-primary/10">
                    <span className="text-gray-600 dark:text-dark-400">IGST</span>
                    <span className="font-medium text-gray-800 dark:text-dark-100">₹ {totals.totalIgst.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between pt-2 text-base font-bold border-t-2 border-primary/20">
                  <span className="text-gray-800 dark:text-dark-100">Total Tax Amount</span>
                  <span className="text-primary">₹ {totals.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold">
                  <span className="text-gray-800 dark:text-dark-100">Net Total (incl. GST)</span>
                  <span className="text-primary">₹ {totals.totalNet.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-(--margin-x) flex flex-wrap gap-3 justify-end">
          <Button variant="outlined" color="error" onClick={handleClearAll}>
            <TrashIcon className="size-4" /> Clear All
          </Button>
          <Button variant="outlined" className="gap-1.5 border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
            onClick={handleHold}
            disabled={cart.length === 0 || !selectedBranch?.value}>
            <PauseIcon className="size-4" /> Hold
          </Button>
          <Button color="primary" onClick={handleSubmit} disabled={creating}>
            <CheckCircleIcon className="size-4" /> {creating ? "Saving..." : "Save B2B Sale"}
          </Button>
        </div>

        {/* Item Selection Modal */}
        <ItemPickModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onPick={applyItemToForm}
          toBranchId={selectedBranch?.value || 0}
          addedVariantIds={addedVariantIds}
        />

        {/* ── Hold List Modal ── */}
        <HoldListModal
          isOpen={showHoldListModal}
          holds={holds}
          onClose={() => setShowHoldListModal(false)}
          onResume={handleResumeHold}
          onDelete={handleDeleteHold}
          formatTime={formatHoldTime}
        />
      </div>
    </Page>
  );
}