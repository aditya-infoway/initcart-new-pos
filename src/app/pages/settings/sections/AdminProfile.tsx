// pages/settings/sections/AdminProfile.tsx
import {
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CameraIcon,
  CheckCircleIcon,
  ClipboardIcon,
  DocumentDuplicateIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  HashtagIcon,
  TagIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import {
  formatDateDDMMYYYY,
  Get,
  Put,
  Patch,
  Post,
  toastsuccessmsg,
  toasterrormsg,
} from "@/ApiHelper";
import { Avatar, Badge, Button, Card, GhostSpinner, Input } from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";
import { GHOST_ENTRY_PATH } from "@/constants/app";
import {
  AuthMeResponse,
  getBranchFromMe,
  getUserFromMe,
} from "@/utils/authMeProfile";

interface AuthMeBranch {
  id?: number | string;
  branch_id?: number | string;
  name?: string;
  branch_name?: string;
  branch_code?: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  branch_type?: string;
  type?: string;
  status?: string;
  is_active?: boolean;
  logo?: string;
  logo_url?: string;
  image?: string;
  created_at?: string;
  created_on?: string;
  date_joined?: string;
  updated_at?: string;
  updated_on?: string;
  last_login?: string;
  owner_name?: string;
  gst_number?: string;
  pan_number?: string;
  gst_no?: string;
  pan_no?: string;
  bank_name?: string;
  bank_account?: string;
  account_number?: string;
  ifsc_code?: string;
  ifsc?: string;
  upi_id?: string;
  upi?: string;
  license?: string;
  license_url?: string;
  gst_certificate?: string;
  gst_certificate_url?: string;
  id_proof?: string;
  id_proof_url?: string;
  pan_card?: string;
  pan_card_url?: string;
  [k: string]: any;
}

// ── Section heading ───────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-dark-600">
      <div className="flex items-center gap-2.5">
        <Icon className="size-5 text-primary" />
        <h3 className="text-[15px] font-extrabold tracking-wide text-gray-800 dark:text-dark-50">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

// ── Helper field row ──────────────────────────────────────────────────────
type FieldValue = string | number | null | undefined;

function FieldRow({
  left,
  right,
  isEditing = false,
  onFieldChange,
}: {
  left: { label: string; icon?: React.ComponentType<{ className?: string }>; value: FieldValue; placeholder?: string; accent?: "info" | "warn" | "error"; editable?: boolean; fieldKey?: string };
  right?: { label: string; icon?: React.ComponentType<{ className?: string }>; value: FieldValue; placeholder?: string; accent?: "info" | "warn" | "error"; editable?: boolean; fieldKey?: string };
  isEditing?: boolean;
  onFieldChange?: (key: string, value: string) => void;
}) {
  const renderCell = (
    label: string,
    Icon: React.ComponentType<{ className?: string }> | undefined,
    value: FieldValue,
    placeholder: string | undefined,
    accent: "info" | "warn" | "error" | undefined,
    editable: boolean | undefined,
    fieldKey: string | undefined,
  ) => {
    const accentBg = {
      info: "bg-sky-50 dark:bg-sky-500/10 text-sky-800 dark:text-sky-300",
      warn: "bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300",
      error: "bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300",
    }[accent ?? "info"];

    const displayValue = value !== undefined && value !== null && String(value).trim() !== ""
      ? String(value)
      : "";

    if (isEditing && editable) {
      return (
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-dark-300">
            {Icon && <Icon className="size-4 text-primary" />}
            {label}
          </label>
          <Input
            placeholder={placeholder ?? label}
            value={displayValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              if (onFieldChange && fieldKey) {
                onFieldChange(fieldKey, e.target.value);
              }
            }}
            className="w-full"
          />
        </div>
      );
    }

    return (
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-dark-300">
          {Icon && <Icon className="size-4 text-primary" />}
          {label}
        </label>
        <div
          className={
            "flex min-h-[42px] items-center rounded-lg border border-gray-200 bg-white px-4 text-[14px] font-semibold text-gray-700 shadow-sm dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 " +
            (accent ? accentBg : "")
          }
        >
          {displayValue || <span className="text-xs text-gray-400 dark:text-dark-400">{placeholder ?? "—"}</span>}
        </div>
      </div>
    );
  };

  if (!right) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          {renderCell(left.label, left.icon, left.value, left.placeholder, left.accent, left.editable, left.fieldKey)}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {renderCell(left.label, left.icon, left.value, left.placeholder, left.accent, left.editable, left.fieldKey)}
      {renderCell(right.label, right.icon, right.value, right.placeholder, right.accent, right.editable, right.fieldKey)}
    </div>
  );
}

// ── Document tile ─────────────────────────────────────────────────────────
function DocTile({
  title,
  subtitle,
  iconTile,
  viewUrl,
  variant = "empty",
}: {
  title: string;
  subtitle: string;
  iconTile: React.ComponentType<{ className?: string }>;
  viewUrl?: string;
  variant?: "empty" | "available";
}) {
  const IconComp = iconTile;
  const isAvailable = variant === "available";
  return (
    <Card className="p-4 h-full">
      <div className="flex h-full flex-col items-center gap-3 text-center">
        <div
          className={
            "grid size-14 place-items-center rounded-2xl shadow-sm " +
            (isAvailable
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 text-gray-400 dark:bg-dark-700 dark:text-dark-300")
          }
        >
          <IconComp className="size-6" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-gray-700 dark:text-dark-100">{title}</p>
          <p className={"mt-0.5 text-[11px] " + (isAvailable ? "text-primary font-semibold" : "text-gray-400 dark:text-dark-400")}>
            {subtitle}
          </p>
        </div>
        {isAvailable && viewUrl && (
          <Button
            size="sm"
            variant="flat"
            color="primary"
            className="mt-auto h-8 gap-1.5 px-3 text-xs font-bold"
            component="a"
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <EyeIcon className="size-3.5" /> View Document
          </Button>
        )}
      </div>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AdminProfile() {
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [raw, setRaw] = useState<AuthMeResponse | null>(null);

  // ── Role check ──────────────────────────────────────────────────────────
  // NOTE: role state (from /auth/me) is kept for display/debug purposes, but
  // isSuperAdmin itself is derived from localStorage — same reliable pattern
  // used across the app (ItemFormPage, ItemsListPage) that already works
  // correctly. Depending only on getUserFromMe(body) here was the bug: if the
  // API response shape didn't match what getUserFromMe expects, userRole
  // stayed empty and every "Edit" button silently disappeared.
  const [userRole, setUserRole] = useState<string>("");

  const isSuperAdmin = useMemo(() => {
    return localStorage.getItem("role") === "superadmin";
  }, []);

  // ── Edit states ────────────────────────────────────────────────────────
  const [isEditingBranchInfo, setIsEditingBranchInfo] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingTax, setIsEditingTax] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  // ── Form states ────────────────────────────────────────────────────────
  const [branchId, setBranchId] = useState<string>("");
  const [branchCode, setBranchCode] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [branchType, setBranchType] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [stateName, setStateName] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [pincode, setPincode] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [upiId, setUpiId] = useState<string>("");
  const [gstNumber, setGstNumber] = useState<string>("");
  const [panNumber, setPanNumber] = useState<string>("");

  // ── Password states ────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // ── Logo states ──────────────────────────────────────────────────────
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [savingLogo, setSavingLogo] = useState(false);

  const loadMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = (await Get("pos/auth/me/")) as AuthMeResponse | any;
      const body = (res?.data ?? res) as AuthMeResponse;
      setRaw(body);

      // Get user role (kept for display/debug — isSuperAdmin uses localStorage above)
      const user = getUserFromMe(body);
      setUserRole(String(user?.role || user?.user_type || localStorage.getItem("role") || ""));

      const b = getBranchFromMe(body);
      setBranchId(String(b.id ?? b.branch_id ?? ""));
      setBranchCode(String(b.branch_code ?? b.code ?? ""));
      setBranchName(String(b.name ?? b.branch_name ?? user.branch_name ?? ""));
      setOwnerName(String(b.owner_name ?? user.name ?? user.full_name ?? ""));
      setPhone(String(b.phone ?? user.phone ?? ""));
      setEmail(String(b.email ?? user.email ?? ""));
      setBranchType(String(b.branch_type ?? b.type ?? ""));
      setAddress(String(b.address ?? ""));
      setCountry(String(b.country ?? ""));
      setStateName(String(b.state ?? ""));
      setCity(String(b.city ?? ""));
      setPincode(String(b.pincode ?? ""));
      setBankName(String(b.bank_name ?? ""));
      setAccountNumber(String(b.bank_account ?? b.account_number ?? ""));
      setIfscCode(String(b.ifsc_code ?? b.ifsc ?? ""));
      setUpiId(String(b.upi_id ?? b.upi ?? ""));
      setGstNumber(String(b.gst_number ?? b.gst_no ?? ""));
      setPanNumber(String(b.pan_number ?? b.pan_no ?? ""));
    } catch {
      toasterrormsg("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const branch = getBranchFromMe(raw);
  const user = getUserFromMe(raw);

  const logoSrc: string =
    (branch?.logo_url || branch?.logo || branch?.image || user?.avatar || user?.profile_image || user?.logo || "") as string;

  const displayName: string =
    (branchName || branch?.name || branch?.branch_name || user?.branch_name || "Branch") as string;

  const statusText =
    String(branch?.status ?? (branch?.is_active ? "Active" : "")) || "Active";
  const isStatusActive = /active|true|verified/i.test(statusText);

  const displayBranchType = (branchType || branch?.branch_type || branch?.type || "") as string;
  const memberSince = (
    branch?.created_at ?? branch?.created_on ?? branch?.date_joined ?? user?.date_joined ?? raw?.created_at ?? raw?.date_joined ?? ""
  ) as string;
  const lastUpdated = (branch?.updated_at ?? branch?.updated_on ?? raw?.updated_at ?? user?.last_login ?? raw?.last_login ?? "") as string;

  const maskAccount = (s: string) =>
    s.length > 4 ? "**** " + s.slice(-4) : s || "";

  // ── Save handlers ─────────────────────────────────────────────────────

  // 1. Save Branch Info
  const handleSaveBranchInfo = async () => {
    if (!branchName.trim()) {
      toasterrormsg("Branch name is required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        branch_name: branchName,
        owner_name: ownerName,
        phone,
        email,
        branch_type: branchType,
      };

      await Patch("pos/auth/me/", payload);
      toastsuccessmsg("Branch info updated successfully!");
      setIsEditingBranchInfo(false);
      loadMe();
    } catch {
      toasterrormsg("Failed to update branch info");
    } finally {
      setSaving(false);
    }
  };

  // 2. Save Location
  const handleSaveLocation = async () => {
    if (!country.trim() || !stateName.trim() || !city.trim()) {
      toasterrormsg("Country, State, and City are required!");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        address,
        country,
        state: stateName,
        city,
        pincode,
      };

      await Patch("pos/auth/me/", payload);
      toastsuccessmsg("Location updated successfully!");
      setIsEditingLocation(false);
      loadMe();
    } catch {
      toasterrormsg("Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  // 3. Save GST/PAN
  const handleSaveTax = async () => {
    setSaving(true);
    try {
      const payload = {
        gst_number: gstNumber,
        pan_number: panNumber,
      };

      await Patch("pos/auth/me/", payload);
      toastsuccessmsg("GST & PAN details updated successfully!");
      setIsEditingTax(false);
      loadMe();
    } catch {
      toasterrormsg("Failed to update GST/PAN details");
    } finally {
      setSaving(false);
    }
  };

  // 4. Save Branch Code
  const handleSaveBranchCode = async () => {
    const code = branchCode.trim().toUpperCase();
    if (code && !/^[A-Z]{3}$/.test(code)) {
      toasterrormsg("Code must be exactly 3 letters (A-Z)");
      return;
    }
    setSaving(true);
    try {
      const payload = { branch_code: code };
      await Patch("pos/auth/me/", payload);
      toastsuccessmsg("Branch code updated successfully!");
      loadMe();
    } catch {
      toasterrormsg("Failed to update branch code");
    } finally {
      setSaving(false);
    }
  };

  // 5. Save Logo
  const handleSaveLogo = async () => {
    if (!logoFile) return;
    setSavingLogo(true);
    try {
      const formData = new FormData();
      formData.append("branch_logo", logoFile);

      await Patch("pos/auth/me/", formData, true);
      toastsuccessmsg("Logo updated successfully!");
      setLogoFile(null);
      setLogoPreview("");
      loadMe();
    } catch {
      toasterrormsg("Failed to update logo");
    } finally {
      setSavingLogo(false);
    }
  };

  // 6. Save Password
  const handleSavePassword = async () => {
    if (!currentPassword) {
      toasterrormsg("Current password is required");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toasterrormsg("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toasterrormsg("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      await Patch("pos/auth/change-password/", payload);
      toastsuccessmsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
    } catch {
      toasterrormsg("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  // 7. Logo select handler
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCancelLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); navigate(GHOST_ENTRY_PATH); }
    finally { setLoggingOut(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <GhostSpinner className="size-10 border-3" />
    </div>
  );

  return (
    <div className="w-full space-y-5 pb-10">

      {/* ── Hero / Banner ────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="relative h-44 w-full bg-gradient-to-br from-[#2563eb] via-[#2b6ef0] to-[#1d4ed8]">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -top-10 -left-10 size-56 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-20 right-10 size-72 rounded-full bg-white/10 blur-3xl" />
          </div>
        </div>
        <div className="relative px-5 pb-6 sm:px-8">
          <div className="relative -mt-20 flex flex-col items-center gap-4 sm:-mt-28">
            <div className="relative">
              <div className="size-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl ring-1 ring-black/5 dark:border-dark-800 dark:bg-dark-800 dark:ring-white/10 sm:size-40">
                {logoPreview ? (
                  <img src={logoPreview} alt="Branch Logo" className="size-full object-cover" />
                ) : logoSrc ? (
                  <img src={logoSrc as string} alt="Branch" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-primary-600 text-4xl font-extrabold text-white sm:text-5xl">
                    {String(displayName).trim().charAt(0).toUpperCase() || "B"}
                  </div>
                )}
              </div>
              {/* ✅ Logo upload - Only SuperAdmin */}
              {isSuperAdmin && (
                <>
                  <label className="absolute bottom-1 right-1 flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-white text-primary shadow-md hover:bg-gray-100 dark:border-dark-800 dark:bg-dark-800">
                    <CameraIcon className="size-4.5" />
                    <input type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                  </label>
                  {logoFile && (
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-1">
                      <button
                        onClick={handleSaveLogo}
                        disabled={savingLogo}
                        className="px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingLogo ? "..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelLogo}
                        className="px-2 py-0.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="w-full text-center">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-dark-50 sm:text-3xl">
                {displayName}
              </h1>
              {ownerName && ownerName !== displayName && (
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-dark-300">
                  {ownerName}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Badge
                  className={
                    "gap-1.5 px-3 py-1 text-[12px] font-extrabold shadow-sm " +
                    (isStatusActive
                      ? "bg-emerald-400/95 text-white hover:bg-emerald-400"
                      : "bg-amber-400/95 text-white hover:bg-amber-400")
                  }
                >
                  <CheckCircleIcon className="size-3.5" />
                  {String(statusText || "Active").charAt(0).toUpperCase() + String(statusText || "Active").slice(1).toLowerCase()}
                </Badge>
                {displayBranchType && (
                  <Badge className="gap-1.5 bg-white/90 px-3 py-1 text-[12px] font-extrabold text-slate-700 shadow-sm">
                    <TagIcon className="size-3.5" />
                    {String(displayBranchType).charAt(0).toUpperCase() + String(displayBranchType).slice(1)}
                  </Badge>
                )}
                {isSuperAdmin && (
                  <Badge className="gap-1.5 bg-indigo-500/90 px-3 py-1 text-[12px] font-extrabold text-white shadow-sm">
                    <SparklesIcon className="size-3.5" />
                    Super Admin
                  </Badge>
                )}
              </div>
              {memberSince && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 dark:text-dark-400">
                  <CalendarDaysIcon className="size-4" />
                  Member since: {formatDateDDMMYYYY(String(memberSince))}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Branch Information ───────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          icon={BuildingStorefrontIcon}
          title="Branch Information"
          action={
            isSuperAdmin && !isEditingBranchInfo ? (
              <Button
                size="sm"
                variant="flat"
                color="primary"
                className="gap-1.5"
                onClick={() => setIsEditingBranchInfo(true)}
              >
                <PencilIcon className="size-4" /> Edit
              </Button>
            ) : isSuperAdmin && isEditingBranchInfo ? (
              <div className="flex gap-2">
                <Button size="sm" variant="flat" onClick={() => setIsEditingBranchInfo(false)}>
                  <XMarkIcon className="size-4" /> Cancel
                </Button>
                <Button size="sm" color="primary" onClick={handleSaveBranchInfo} disabled={saving}>
                  <CheckCircleIcon className="size-4" /> {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : null
          }
        />
        <div className="space-y-4">
          <FieldRow
            left={{
              label: "Branch ID",
              icon: HashtagIcon,
              value: branchId,
              placeholder: "Branch ID",
              accent: "info",
            }}
            right={{
              label: "Branch Code",
              icon: IdentificationIcon,
              value: branchCode,
              placeholder: "e.g. D8E",
              editable: isSuperAdmin,
              fieldKey: "branchCode",
            }}
            isEditing={isEditingBranchInfo}
            onFieldChange={(key, val) => {
              if (key === "branchCode") setBranchCode(val);
            }}
          />
          {isSuperAdmin && isEditingBranchInfo && (
            <div className="-mt-2 flex justify-end">
              <Button size="sm" variant="soft" color="primary" onClick={handleSaveBranchCode} disabled={saving}>
                Save Branch Code
              </Button>
            </div>
          )}
          {branchCode && (
            <p className="-mt-1 text-[10.5px] font-semibold text-gray-400 dark:text-dark-400">
              Will be used in Order ID /DB/{branchCode}/ DD-MM-YY / 100001
            </p>
          )}
          <FieldRow
            left={{
              label: "Branch Name",
              icon: BuildingStorefrontIcon,
              value: branchName,
              placeholder: "Branch name",
              editable: isSuperAdmin,
              fieldKey: "branchName",
            }}
            right={{
              label: "Owner Name",
              icon: SparklesIcon,
              value: ownerName,
              placeholder: "Owner / In-charge name",
              editable: isSuperAdmin,
              fieldKey: "ownerName",
            }}
            isEditing={isEditingBranchInfo}
            onFieldChange={(key, val) => {
              if (key === "branchName") setBranchName(val);
              if (key === "ownerName") setOwnerName(val);
            }}
          />
          <FieldRow
            left={{
              label: "Phone",
              icon: PhoneIcon,
              value: phone,
              placeholder: "Branch contact number",
              editable: isSuperAdmin,
              fieldKey: "phone",
            }}
            right={{
              label: "Email",
              icon: EnvelopeIcon,
              value: email,
              placeholder: "Branch email",
              editable: isSuperAdmin,
              fieldKey: "email",
            }}
            isEditing={isEditingBranchInfo}
            onFieldChange={(key, val) => {
              if (key === "phone") setPhone(val);
              if (key === "email") setEmail(val);
            }}
          />
          <FieldRow
            left={{
              label: "Branch Type",
              icon: FolderIcon,
              value: branchType,
              placeholder: "e.g. Fashion, Retail, etc.",
              editable: isSuperAdmin,
              fieldKey: "branchType",
            }}
            isEditing={isEditingBranchInfo}
            onFieldChange={(key, val) => {
              if (key === "branchType") setBranchType(val);
            }}
          />
        </div>
      </Card>

      {/* ── Address Details ──────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionHeader
          icon={MapPinIcon}
          title="Address Details"
          action={
            isSuperAdmin && !isEditingLocation ? (
              <Button size="sm" variant="flat" color="primary" className="gap-1.5" onClick={() => setIsEditingLocation(true)}>
                <PencilIcon className="size-4" /> Edit
              </Button>
            ) : isSuperAdmin && isEditingLocation ? (
              <div className="flex gap-2">
                <Button size="sm" variant="flat" onClick={() => setIsEditingLocation(false)}>
                  <XMarkIcon className="size-4" /> Cancel
                </Button>
                <Button size="sm" color="primary" onClick={handleSaveLocation} disabled={saving}>
                  <CheckCircleIcon className="size-4" /> {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : null
          }
        />
        <div className="space-y-4">
          <FieldRow
            left={{
              label: "Complete Address",
              icon: HomeIcon,
              value: address,
              placeholder: "Street / Area / Landmark",
              editable: isSuperAdmin,
              fieldKey: "address",
            }}
            isEditing={isEditingLocation}
            onFieldChange={(key, val) => {
              if (key === "address") setAddress(val);
            }}
          />
          <FieldRow
            left={{
              label: "Country",
              icon: GlobeAltIcon,
              value: country,
              placeholder: "Country name",
              accent: !country || /not specified|not specified/i.test(country) ? "warn" : "info",
              editable: isSuperAdmin,
              fieldKey: "country",
            }}
            right={{
              label: "State",
              icon: MapPinIcon,
              value: stateName,
              placeholder: "State",
              editable: isSuperAdmin,
              fieldKey: "stateName",
            }}
            isEditing={isEditingLocation}
            onFieldChange={(key, val) => {
              if (key === "country") setCountry(val);
              if (key === "stateName") setStateName(val);
            }}
          />
          <FieldRow
            left={{
              label: "City",
              icon: MapPinIcon,
              value: city,
              placeholder: "City",
              editable: isSuperAdmin,
              fieldKey: "city",
            }}
            right={{
              label: "Pincode",
              icon: HashtagIcon,
              value: pincode,
              placeholder: "Pincode / ZIP",
              editable: isSuperAdmin,
              fieldKey: "pincode",
            }}
            isEditing={isEditingLocation}
            onFieldChange={(key, val) => {
              if (key === "city") setCity(val);
              if (key === "pincode") setPincode(val);
            }}
          />
        </div>
      </Card>

      {/* ── GST/PAN Details ─────────────────────────────────────────── */}
      {isSuperAdmin && (
        <Card className="p-5 sm:p-6">
          <SectionHeader
            icon={IdentificationIcon}
            title="GST & PAN Details"
            action={
              !isEditingTax ? (
                <Button size="sm" variant="flat" color="primary" className="gap-1.5" onClick={() => setIsEditingTax(true)}>
                  <PencilIcon className="size-4" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onClick={() => setIsEditingTax(false)}>
                    <XMarkIcon className="size-4" /> Cancel
                  </Button>
                  <Button size="sm" color="primary" onClick={handleSaveTax} disabled={saving}>
                    <CheckCircleIcon className="size-4" /> {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )
            }
          />
          <div className="space-y-4">
            <FieldRow
              left={{
                label: "GST Number",
                icon: DocumentTextIcon,
                value: gstNumber,
                placeholder: "e.g. 24AAAAA0000A1Z5",
                editable: isSuperAdmin,
                fieldKey: "gstNumber",
              }}
              right={{
                label: "PAN Number",
                icon: IdentificationIcon,
                value: panNumber,
                placeholder: "e.g. ABCDE1234F",
                editable: isSuperAdmin,
                fieldKey: "panNumber",
              }}
              isEditing={isEditingTax}
              onFieldChange={(key, val) => {
                if (key === "gstNumber") setGstNumber(val.toUpperCase());
                if (key === "panNumber") setPanNumber(val.toUpperCase());
              }}
            />
          </div>
        </Card>
      )}

      {/* ── Bank Details ─────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionHeader icon={BanknotesIcon} title="Bank Details" />
        <div className="space-y-4">
          <FieldRow
            left={{
              label: "Bank Name",
              icon: BanknotesIcon,
              value: bankName,
              placeholder: "Bank name",
            }}
            right={{
              label: "Account Number",
              icon: ClipboardIcon,
              value: accountNumber ? maskAccount(String(accountNumber)) : "",
              placeholder: "Account number",
            }}
          />
          <FieldRow
            left={{
              label: "IFSC Code",
              icon: HashtagIcon,
              value: ifscCode,
              placeholder: "IFSC code",
            }}
            right={{
              label: "UPI ID",
              icon: SparklesIcon,
              value: upiId,
              placeholder: "e.g. branch@upi",
            }}
          />
        </div>
      </Card>

      {/* ── Documents ────────────────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionHeader icon={FolderIcon} title="Documents" />
        <div className="grid gap-4 sm:grid-cols-3">
          <DocTile
            title="License File"
            subtitle={branch?.license || branch?.license_url ? "Uploaded" : "Not uploaded"}
            iconTile={DocumentTextIcon}
            viewUrl={String(branch?.license_url || branch?.license || "") || undefined}
            variant={branch?.license || branch?.license_url ? "available" : "empty"}
          />
          <DocTile
            title="GST Certificate"
            subtitle={branch?.gst_certificate || branch?.gst_certificate_url ? "Uploaded" : "Not uploaded"}
            iconTile={DocumentDuplicateIcon}
            viewUrl={String(branch?.gst_certificate_url || branch?.gst_certificate || "") || undefined}
            variant={branch?.gst_certificate || branch?.gst_certificate_url ? "available" : "empty"}
          />
          <DocTile
            title="ID Proof"
            subtitle={branch?.id_proof || branch?.id_proof_url ? "Uploaded" : "Not uploaded"}
            iconTile={IdentificationIcon}
            viewUrl={String(branch?.id_proof_url || branch?.id_proof || "") || undefined}
            variant={branch?.id_proof || branch?.id_proof_url ? "available" : "empty"}
          />
        </div>
      </Card>

      {/* ── Account Information ──────────────────────────────────── */}
      <Card className="p-5 sm:p-6">
        <SectionHeader icon={CalendarDaysIcon} title="Account Information" />
        <div className="space-y-4">
          <FieldRow
            left={{
              label: "Account Created",
              icon: CalendarDaysIcon,
              value: memberSince ? formatDateDDMMYYYY(String(memberSince)) : "",
              placeholder: "—",
              accent: "info",
            }}
            right={{
              label: "Last Updated",
              icon: ArrowPathIcon,
              value: lastUpdated ? formatDateDDMMYYYY(String(lastUpdated)) : "",
              placeholder: "—",
            }}
          />
        </div>
      </Card>

      {/* ── Password Change ── Only SuperAdmin ───────────────────── */}
      {isSuperAdmin && (
        <Card className="p-5 sm:p-6">
          <SectionHeader
            icon={KeyIcon}
            title="Branch Panel Login Password"
            action={
              !isEditingPassword ? (
                <Button size="sm" variant="flat" color="primary" className="gap-1.5" onClick={() => setIsEditingPassword(true)}>
                  <PencilIcon className="size-4" /> Change Password
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" variant="flat" onClick={() => setIsEditingPassword(false)}>
                    <XMarkIcon className="size-4" /> Cancel
                  </Button>
                  <Button size="sm" color="primary" onClick={handleSavePassword} disabled={saving}>
                    <CheckCircleIcon className="size-4" /> {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )
            }
          />
          {isEditingPassword && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-dark-300">
                    <KeyIcon className="size-4 text-primary" />
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPwd ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showCurrentPwd ? <EyeIcon className="size-4" /> : <EyeSlashIcon className="size-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-dark-300">
                    <KeyIcon className="size-4 text-primary" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showNewPwd ? <EyeIcon className="size-4" /> : <EyeSlashIcon className="size-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-dark-300">
                    <KeyIcon className="size-4 text-primary" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPwd ? <EyeIcon className="size-4" /> : <EyeSlashIcon className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Logout ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error/5 p-4 pr-6 dark:bg-error/10">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-error/10 text-error dark:bg-error/20">
              <ArrowRightOnRectangleIcon className="size-5" />
            </div>
            <div>
              <h4 className="text-[14px] font-extrabold text-error">Logout</h4>
              <p className="mt-1 text-[12px] font-medium text-gray-500 dark:text-dark-300">
                This will securely log you out from your branch account.
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outlined"
          color="error"
          className="h-10 gap-2 px-5 text-sm font-extrabold"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ArrowPathIcon className="size-4.5 animate-spin" />
            : <ArrowRightOnRectangleIcon className="size-4.5" />}
          Logout
        </Button>
      </div>
    </div>
  );
}

// ── Missing Icons ─────────────────────────────────────────────────────────
const KeyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.16 13.16 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);