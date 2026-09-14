// src/app/pages/settings/SettingsPage.tsx
import {
  Cog6ToothIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Page } from "@/components/shared/Page";
import { Button, Input } from "@/components/ui";
import { Get, Post, Patch, toastsuccessmsg, toasterrormsg } from "@/ApiHelper";
import { usePermission } from "@/hooks/usePermissions";

// ── Types ──────────────────────────────────────────────────────────────────
interface Branch {
  id: number;
  branch_name: string;
}

type PrefixKey = "BP" | "CP" | "CR" | "BR" | "PI" | "SI" | "SR" | "PR" | "contra" | "JE";

interface PrefixValues {
  BP: string;
  CP: string;
  CR: string;
  BR: string;
  PI: string;
  SI: string;
  SR: string;
  PR: string;
  contra: string;
  JE: string;
}

const PREFIX_LABELS: Record<PrefixKey, string> = {
  BP: "BP (Branch Purchase)",
  CP: "CP (Cash Purchase)",
  CR: "CR (Cash Receipt)",
  BR: "BR (Bank Receipt)",
  PI: "PI (Purchase Invoice)",
  SI: "SI (Sales Invoice)",
  SR: "SR (Sales Return)",
  PR: "PR (Purchase Return)",
  contra: "CT (Contra)",
  JE: "JE (Journal Entry)",
};

const DEFAULT_PREFIXES: PrefixValues = {
  BP: "", CP: "", CR: "", BR: "", PI: "", SI: "", SR: "", PR: "", contra: "", JE: "",
};

// ── Toggle Switch Component ────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  color = "primary",
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  color?: "primary" | "success" | "info";
}) {
  const colorClass = {
    primary: "bg-primary-500",
    success: "bg-success-500",
    info: "bg-info-500",
  }[color];

  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
        checked ? colorClass : "bg-gray-300 dark:bg-dark-500",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <span
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 mt-0.5",
          checked ? "translate-x-5.5 ml-0.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { canEdit } = usePermission("/Settings");
  const isSuperAdmin = useMemo(() => localStorage.getItem("role") === "superadmin", []);

  // ── Toggle states ──
  const [gstToggle, setGstToggle] = useState(false);
  const [salesGstToggle, setSalesGstToggle] = useState(false);
  const [stockTransferGstToggle, setStockTransferGstToggle] = useState(false);

  // ── Bill display mode (superadmin only) ──
  const [billDisplayMode, setBillDisplayMode] = useState<"main" | "branch">("branch");
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
  const [billSettingLoading, setBillSettingLoading] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");

  // ── Prefix values ──
  const [prefixValues, setPrefixValues] = useState<PrefixValues>(DEFAULT_PREFIXES);

  // ── Loading states ──
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingExists, setSettingExists] = useState(false);

  // ── Fetch settings ─────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    try {
      const res = await Get("pos/settings/") as any;
      const data = res?.data ?? res;

      setGstToggle(Boolean(data?.gst_toggle));
      setPrefixValues({
        BP:     String(data?.BP ?? ""),
        CP:     String(data?.CP ?? ""),
        CR:     String(data?.CR ?? ""),
        BR:     String(data?.BR ?? ""),
        PI:     String(data?.PI ?? ""),
        SI:     String(data?.SI ?? ""),
        SR:     String(data?.SR ?? ""),
        PR:     String(data?.PR ?? ""),
        contra: String(data?.contra ?? ""),
        JE:     String(data?.JE ?? ""),
      });
      setSettingExists(true);
    } catch {
      setSettingExists(false);
    }
  }, []);

  const fetchTaxApply = useCallback(async () => {
    try {
      const res = await Get("pos/tax-apply-update/") as any;
      const data = res?.data ?? res;
      setGstToggle(Boolean(data?.gst_toggle));
    } catch (e) {
      console.error("Failed to fetch tax_apply", e);
    }
  }, []);

  const fetchSalesTaxApply = useCallback(async () => {
    try {
      const res = await Get("pos/sales-tax-apply-update/") as any;
      const data = res?.data ?? res;
      setSalesGstToggle(Boolean(data?.sales_gst_toggle));
    } catch (e) {
      console.error("Failed to fetch sales_gst_toggle", e);
    }
  }, []);

  const fetchStockTransferTaxApply = useCallback(async () => {
    try {
      const res = await Get("pos/stock-transfer-tax-apply-update/") as any;
      const data = res?.data ?? res;
      setStockTransferGstToggle(Boolean(data?.stock_transfer_gst_toggle));
    } catch (e) {
      console.error("Failed to fetch stock_transfer_gst_toggle", e);
    }
  }, []);

  const fetchBillDisplaySetting = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await Get("pos/sales-bill-display-setting/") as any;
      const data = res?.data ?? res;
      setBillDisplayMode((data?.mode === "main" ? "main" : "branch"));
      setSelectedBranchIds(Array.isArray(data?.selected_branches) ? data.selected_branches : []);
    } catch (e) {
      console.error("Failed to fetch bill display setting", e);
    }
  }, [isSuperAdmin]);

  const fetchBranches = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await Get("pos/branches/", { page_size: 500 }) as any;
      const body = res?.data ?? res;
      const list: any[] = Array.isArray(body?.data) ? body.data
        : Array.isArray(body?.results) ? body.results
        : Array.isArray(body) ? body : [];
      setAllBranches(list.map((b: any) => ({ id: Number(b.id), branch_name: String(b.branch_name ?? "") })));
    } catch (e) {
      console.error("Failed to fetch branches", e);
    }
  }, [isSuperAdmin]);

  // ── Initial load ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchSettings(),
        fetchTaxApply(),
        fetchSalesTaxApply(),
        fetchStockTransferTaxApply(),
        fetchBillDisplaySetting(),
        fetchBranches(),
      ]);
      setLoading(false);
    })();
  }, [fetchSettings, fetchTaxApply, fetchSalesTaxApply, fetchStockTransferTaxApply, fetchBillDisplaySetting, fetchBranches]);

  // ── Toggle handlers ────────────────────────────────────────────────────
  const toggleTax = async () => {
    const newValue = !gstToggle;
    setGstToggle(newValue);
    try {
      if (settingExists) {
        await Patch("pos/tax-apply-update/", { gst_toggle: newValue });
      } else {
        await Post("pos/settings/", { gst_toggle: newValue });
        setSettingExists(true);
      }
      toastsuccessmsg(`Purchase Tax ${newValue ? "Included" : "Excluded"}`);
    } catch {
      setGstToggle(!newValue);
      toasterrormsg("Failed to update purchase tax");
    }
  };

  const toggleSalesTax = async () => {
    const newValue = !salesGstToggle;
    setSalesGstToggle(newValue);
    try {
      await Patch("pos/sales-tax-apply-update/", { sales_gst_toggle: newValue });
      toastsuccessmsg(`Sales Tax ${newValue ? "Included (Add on top)" : "Excluded (Included in price)"}`);
    } catch {
      setSalesGstToggle(!newValue);
      toasterrormsg("Failed to update sales tax");
    }
  };

  const toggleStockTransferTax = async () => {
    if (!isSuperAdmin) return;
    const newValue = !stockTransferGstToggle;
    setStockTransferGstToggle(newValue);
    try {
      await Patch("pos/stock-transfer-tax-apply-update/", { stock_transfer_gst_toggle: newValue });
      toastsuccessmsg(`Stock Transfer Tax ${newValue ? "Excluded (Add on top)" : "Included"}`);
    } catch {
      setStockTransferGstToggle(!newValue);
      toasterrormsg("Failed to update stock transfer tax");
    }
  };

  // ── Bill display mode ──────────────────────────────────────────────────
  const updateBillDisplayMode = async (mode: "main" | "branch") => {
    setBillDisplayMode(mode);
    setBillSettingLoading(true);
    try {
      await Patch("pos/sales-bill-display-setting/", { mode });
      toastsuccessmsg(`Sales bill display set to ${mode === "main" ? "Main Branch" : "Selected Branches"}`);
    } catch {
      toasterrormsg("Failed to update bill display setting");
    } finally {
      setBillSettingLoading(false);
    }
  };

  const updateSelectedBranches = async (ids: number[]) => {
    setBillSettingLoading(true);
    try {
      await Patch("pos/sales-bill-display-setting/", { selected_branches: ids });
      toastsuccessmsg("Selected branches updated");
    } catch {
      toasterrormsg("Failed to update selected branches");
      await fetchBillDisplaySetting();
    } finally {
      setBillSettingLoading(false);
    }
  };

  const toggleBranchSelection = (branchId: number) => {
    const updated = selectedBranchIds.includes(branchId)
      ? selectedBranchIds.filter((id) => id !== branchId)
      : [...selectedBranchIds, branchId];
    setSelectedBranchIds(updated);
    updateSelectedBranches(updated);
  };

  const selectAllBranches = () => {
    const allIds = allBranches.map((b) => b.id);
    setSelectedBranchIds(allIds);
    updateSelectedBranches(allIds);
  };

  const clearAllBranches = () => {
    setSelectedBranchIds([]);
    updateSelectedBranches([]);
  };

  // ── Prefix change ──────────────────────────────────────────────────────
  const handlePrefixChange = (key: PrefixKey, value: string) => {
    setPrefixValues((prev) => ({ ...prev, [key]: value }));
  };

  // ── Save settings ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...prefixValues, gst_toggle: gstToggle };
      if (settingExists) {
        await Patch("pos/settings-update/", payload);
      } else {
        await Post("pos/settings/", payload);
        setSettingExists(true);
      }
      toastsuccessmsg("Settings saved successfully");
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── Filtered branches for search ───────────────────────────────────────
  const filteredBranches = useMemo(() => {
    if (!branchSearch.trim()) return allBranches;
    const term = branchSearch.toLowerCase();
    return allBranches.filter((b) => b.branch_name.toLowerCase().includes(term));
  }, [allBranches, branchSearch]);

  const selectedBranchNames = useMemo(
    () => allBranches.filter((b) => selectedBranchIds.includes(b.id)),
    [allBranches, selectedBranchIds],
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Page title="Settings">
      <div className="transition-content w-full pb-8">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="px-(--margin-x) pt-4 pb-2 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
            <Cog6ToothIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Settings
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-dark-300">
              Configure tax, prefixes and bill display options
            </p>
          </div>
        </div>

        {/* ── Tax Settings ─────────────────────────────────────────── */}
        <div className="px-(--margin-x) mt-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-500 dark:bg-dark-750 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
              <ReceiptPercentIcon className="size-4" />
              Tax Settings
            </div>

            {/* Purchase Tax */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="min-w-[180px] text-sm font-medium text-gray-700 dark:text-dark-200">
                Purchase Tax Apply
              </span>
              <ToggleSwitch
                checked={gstToggle}
                onChange={toggleTax}
                disabled={loading}
                color="success"
              />
              <span className={clsx(
                "text-sm font-medium",
                gstToggle ? "text-success-600 dark:text-success-400" : "text-gray-500 dark:text-dark-300",
              )}>
                {gstToggle ? "ON — GST added on top" : "OFF — GST included in price"}
              </span>
            </div>

            {/* Sales Tax */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="min-w-[180px] text-sm font-medium text-gray-700 dark:text-dark-200">
                Sales Tax Apply
              </span>
              <ToggleSwitch
                checked={salesGstToggle}
                onChange={toggleSalesTax}
                disabled={loading}
                color="info"
              />
              <span className={clsx(
                "text-sm font-medium",
                salesGstToggle ? "text-info-600 dark:text-info-400" : "text-gray-500 dark:text-dark-300",
              )}>
                {salesGstToggle ? "ON — GST added on top" : "OFF — GST included in price"}
              </span>
            </div>

            {/* Stock Transfer Tax (superadmin only) — uncomment if needed */}
            {/* {isSuperAdmin && (
              <div className="flex flex-wrap items-center gap-4">
                <span className="min-w-[180px] text-sm font-medium text-gray-700 dark:text-dark-200">
                  Stock Transfer Tax Apply
                </span>
                <ToggleSwitch
                  checked={stockTransferGstToggle}
                  onChange={toggleStockTransferTax}
                  disabled={loading}
                  color="primary"
                />
                <span className={clsx(
                  "text-sm font-medium",
                  stockTransferGstToggle ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-dark-300",
                )}>
                  {stockTransferGstToggle ? "ON — GST added on top" : "OFF — GST included in branch price"}
                </span>
                <span className="text-xs italic text-gray-400">Superadmin only</span>
              </div>
            )} */}
          </div>
        </div>

        {/* ── Sales Bill Display (superadmin only) ─────────────────── */}
        {isSuperAdmin && (
          <div className="px-(--margin-x) mt-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-500 dark:bg-dark-750 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
                <BuildingOfficeIcon className="size-4" />
                Sales Bill — Branch Details Display
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {/* Main Branch radio */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="billDisplayMode"
                    checked={billDisplayMode === "main"}
                    onChange={() => updateBillDisplayMode("main")}
                    disabled={billSettingLoading}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-dark-200">Main Branch</span>
                </label>

                {/* Branch radio */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="billDisplayMode"
                    checked={billDisplayMode === "branch"}
                    onChange={() => updateBillDisplayMode("branch")}
                    disabled={billSettingLoading}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-dark-200">Selected Branches</span>
                </label>
              </div>

              {/* Branch dropdown — only when "branch" mode */}
              {billDisplayMode === "branch" && (
                <div className="relative w-full max-w-md">
                  {/* Trigger button */}
                  <button
                    type="button"
                    onClick={() => setBranchDropdownOpen((v) => !v)}
                    disabled={billSettingLoading}
                    className={clsx(
                      "flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-colors dark:bg-dark-800",
                      branchDropdownOpen
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-gray-300 hover:border-gray-400 dark:border-dark-500",
                    )}
                  >
                    <span className="truncate text-gray-700 dark:text-dark-200">
                      {selectedBranchIds.length === 0
                        ? "Select branches..."
                        : `${selectedBranchIds.length} branch${selectedBranchIds.length > 1 ? "es" : ""} selected`}
                    </span>
                    <ChevronDownIcon className={clsx("size-4 text-gray-400 transition-transform", branchDropdownOpen && "rotate-180")} />
                  </button>

                  {/* Dropdown panel */}
                  {branchDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-dark-500 dark:bg-dark-750">
                      {/* Search */}
                      <div className="border-b border-gray-200 p-2 dark:border-dark-600">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            placeholder="Search branches..."
                            className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
                          />
                        </div>
                      </div>

                      {/* Select All / Clear All */}
                      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 dark:border-dark-600">
                        <button
                          type="button"
                          onClick={selectAllBranches}
                          className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearAllBranches}
                          className="text-xs font-medium text-error-600 hover:text-error-700 dark:text-error-400"
                        >
                          Clear All
                        </button>
                      </div>

                      {/* Branch list */}
                      <div className="max-h-60 overflow-y-auto p-1">
                        {filteredBranches.length === 0 ? (
                          <div className="py-6 text-center text-xs text-gray-400 dark:text-dark-400">
                            No branches found
                          </div>
                        ) : (
                          filteredBranches.map((branch) => (
                            <label
                              key={branch.id}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-dark-600"
                            >
                              <input
                                type="checkbox"
                                checked={selectedBranchIds.includes(branch.id)}
                                onChange={() => toggleBranchSelection(branch.id)}
                                className="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="text-gray-700 dark:text-dark-200">{branch.branch_name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected badges */}
                  {selectedBranchNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedBranchNames.map((b) => (
                        <span
                          key={b.id}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary/20 dark:text-primary-300"
                        >
                          {b.branch_name}
                          <button
                            type="button"
                            onClick={() => toggleBranchSelection(b.id)}
                            className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            <XMarkIcon className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Prefix Settings ──────────────────────────────────────── */}
        <div className="px-(--margin-x) mt-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-500 dark:bg-dark-750 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
              <DocumentTextIcon className="size-4" />
              Prefix Settings
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(Object.keys(prefixValues) as PrefixKey[]).map((key) => (
                <Input
                  key={key}
                  label={PREFIX_LABELS[key]}
                  value={prefixValues[key]}
                  onChange={(e) => handlePrefixChange(key, e.target.value)}
                  placeholder={`Enter prefix for ${key === "contra" ? "CT" : key}`}
                  classNames={{ input: "h-9 text-sm" }}
                />
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                color="primary"
                className="h-10 min-w-[140px] gap-2 rounded-md px-6 text-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckIcon className="size-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </Page>
  );
}