// Import Dependencies
import {
  CalendarDaysIcon,
  CameraIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

// Local Imports
import { Get, Put, toastsuccessmsg, toasterrormsg } from "@/ApiHelper";
import { Avatar, Badge, Button, Card, GhostSpinner, Input } from "@/components/ui";
import { useAuthContext } from "@/app/contexts/auth/context";
import { GHOST_ENTRY_PATH } from "@/constants/app";

// ----------------------------------------------------------------------

interface AdminProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_image: string;
  brochure_pdf: string;
  brochure_pdf_url: string;
  youtube: string;
  instagram: string;
  twitter: string;
  facebook: string;
  whatsapp: string;
  joinDate: string;
}

interface DashboardStats {
  totalProductVendor: number;
  totalServiceVendor: number;
  totalLoginUsers: number;
}

interface ProfileFormValues {
  name: string;
  phone: string;
  address: string;
  youtube: string;
  instagram: string;
  twitter: string;
  facebook: string;
  whatsapp: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newEmail: string;
  newPassword: string;
  confirmPassword: string;
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "success" | "info";
}) {
  const cls = {
    primary: {
      bg: "bg-primary",
      iconBg: "bg-white/20",
      text: "text-white",
      subtext: "text-white/70",
    },
    success: {
      bg: "bg-success",
      iconBg: "bg-white/20",
      text: "text-white",
      subtext: "text-white/70",
    },
    info: {
      bg: "bg-info",
      iconBg: "bg-white/20",
      text: "text-white",
      subtext: "text-white/70",
    },
  }[color];

  return (
    <div className={`${cls.bg} relative overflow-hidden rounded-2xl p-5 shadow-sm`}>
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 bottom-2 size-14 rounded-full bg-white/10" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider ${cls.subtext}`}>
            {label}
          </p>
          <p className={`mt-2 text-4xl font-bold ${cls.text}`}>{value}</p>
        </div>
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${cls.iconBg}`}>
          <Icon className={`size-6 ${cls.text}`} />
        </div>
      </div>
    </div>
  );
}

// ── Section heading ────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-400">
      {children}
    </h3>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AdminProfile() {
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Brochure state
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  const { register: reg, handleSubmit: hProfile, reset: resetProfile,
    formState: { errors: pErr } } = useForm<ProfileFormValues>();

  const { register: regPwd, handleSubmit: hPwd, reset: resetPwd,
    formState: { errors: pwdErr }, setError: setPwdErr } = useForm<PasswordFormValues>();

  // ── Fetch ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        Get("banners/admin-profile/", {}, false) as any,
        Get("banners/dashboard-stats/", {}, false) as any,
      ]);
      const p: AdminProfileData = pRes?.data ?? pRes;
      const s: DashboardStats = sRes?.data ?? sRes;
      setProfile(p);
      setStats(s);
      setPhotoPreview(p.profile_image || "");
      resetProfile({
        name: p.name ?? "", phone: p.phone ?? "", address: p.address ?? "",
        youtube: p.youtube ?? "", instagram: p.instagram ?? "",
        twitter: p.twitter ?? "", facebook: p.facebook ?? "", whatsapp: p.whatsapp ?? "",
      });
    } catch {
      toasterrormsg("Failed to load admin profile.");
    } finally {
      setLoading(false);
    }
  }, [resetProfile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Photo change ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Save profile ──
  const onSaveProfile = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (photoFile) fd.append("profile_image", photoFile);
      if (brochureFile) fd.append("brochure_pdf", brochureFile);
      await Put("banners/admin-profile/", fd, true);
      toastsuccessmsg("Profile updated successfully.");
      setPhotoFile(null);
      setBrochureFile(null);
      fetchAll();
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Save password ──
  const onSavePwd = async (values: PasswordFormValues) => {
    if (values.newPassword && values.newPassword !== values.confirmPassword) {
      setPwdErr("confirmPassword", { message: "Passwords do not match." });
      return;
    }
    setSavingPwd(true);
    try {
      const payload: Record<string, string> = { current_password: values.currentPassword };
      if (values.newEmail) payload.email = values.newEmail;
      if (values.newPassword) payload.password = values.newPassword;
      await Put("banners/admin-profile/", payload, false);
      toastsuccessmsg("Login credentials updated.");
      resetPwd();
    } catch (e: any) {
      toasterrormsg(e?.response?.data?.message || e?.response?.data?.current_password?.[0] || "Failed to update credentials.");
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate(GHOST_ENTRY_PATH); };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <GhostSpinner className="size-10 border-3" />
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-10">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        {/* Gradient banner */}
        <div className="h-32 w-full bg-gradient-to-r from-primary to-primary-600 sm:h-40" />

        {/* Profile row */}
        <div className="relative px-6 pb-6">
          {/* Avatar — overlaps banner */}
          <div className="relative -mt-14 mb-4 inline-block">
            <div className="size-28 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-dark-700 dark:bg-dark-600">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center bg-primary/10 text-4xl font-bold text-primary">
                  {profile?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
              )}
            </div>
            {/* Camera button */}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow transition hover:bg-primary-600 dark:border-dark-700"
            >
              <CameraIcon className="size-4" />
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            {photoFile && (
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(profile?.profile_image || ""); }}
                className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-error text-white shadow"
              >
                <XMarkIcon className="size-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile?.name || "Admin"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge color="primary" variant="soft">Superadmin</Badge>
                <span className="text-sm text-gray-500 dark:text-dark-300">{profile?.email}</span>
                {profile?.joinDate && (
                  <span className="flex items-center gap-1 text-sm text-gray-400 dark:text-dark-400">
                    <CalendarDaysIcon className="size-4" />
                    Joined {profile.joinDate}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outlined" color="error" className="gap-2" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Product Vendors" value={stats.totalProductVendor} icon={BuildingStorefrontIcon} color="primary" />
          <StatCard label="Total Service Vendors" value={stats.totalServiceVendor} icon={WrenchScrewdriverIcon} color="success" />
          <StatCard label="Total Login Customers" value={stats.totalLoginUsers} icon={UsersIcon} color="info" />
        </div>
      )}

      {/* ── Profile form ─────────────────────────────────────────────── */}
      <form onSubmit={hProfile(onSaveProfile)} className="space-y-6">

        {/* Admin Information */}
        <Card className="p-5 sm:p-6">
          <SectionTitle>Admin Information</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={<>Name <span className="text-red-500">*</span></>}
              prefix={<UserIcon className="size-4" />}
              placeholder="Admin name"
              error={pErr.name?.message}
              {...reg("name", { required: "Name is required" })}
            />
            <Input
              label="Phone Number"
              prefix={<PhoneIcon className="size-4" />}
              placeholder="Phone number"
              {...reg("phone")}
            />
            <Input
              label="Address"
              prefix={<MapPinIcon className="size-4" />}
              placeholder="Address"
              classNames={{ root: "sm:col-span-2" }}
              {...reg("address")}
            />
          </div>
        </Card>

        {/* Company Brochure */}
        <Card className="p-5 sm:p-6">
          <SectionTitle>Company Brochure</SectionTitle>
          <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
            Upload your company brochure in PDF format. This will be available for download on your website footer.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outlined" className="gap-2" onClick={() => brochureInputRef.current?.click()}>
              <DocumentTextIcon className="size-4" />
              Upload Brochure (PDF)
            </Button>
            <input ref={brochureInputRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => setBrochureFile(e.target.files?.[0] ?? null)} />
            {brochureFile && (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-dark-500 dark:bg-dark-700">
                <DocumentTextIcon className="size-4 text-error" />
                <span className="max-w-[200px] truncate">{brochureFile.name}</span>
                <button type="button" onClick={() => setBrochureFile(null)} className="ml-1 text-gray-400 hover:text-error">
                  <XMarkIcon className="size-4" />
                </button>
              </div>
            )}
          </div>
          {profile?.brochure_pdf_url && !brochureFile && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <a href={profile.brochure_pdf_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <LinkIcon className="size-4" />
                Preview Uploaded Brochure
              </a>
              <button type="button" className="text-xs font-semibold text-error hover:underline"
                onClick={async () => {
                  try {
                    await Put("banners/admin-profile/", { brochure_pdf: "" }, false);
                    toastsuccessmsg("Brochure removed."); fetchAll();
                  } catch { toasterrormsg("Failed to remove brochure."); }
                }}>
                Remove
              </button>
            </div>
          )}
        </Card>

        {/* Social Links */}
        <Card className="p-5 sm:p-6">
          <SectionTitle>Social Links</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
              { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
              { name: "twitter", label: "Twitter", placeholder: "https://x.com/..." },
              { name: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
              { name: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/..." },
            ] as const).map(({ name, label, placeholder }) => (
              <Input key={name} label={label}
                prefix={<GlobeAltIcon className="size-4" />}
                placeholder={placeholder} {...reg(name)} />
            ))}
          </div>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button type="submit" color="primary" className="gap-2 min-w-[9rem]" disabled={saving}>
            {saving && <GhostSpinner variant="soft" className="size-4 border-2" />}
            Save Profile
          </Button>
        </div>
      </form>

      {/* ── Password / Email form ─────────────────────────────────────── */}
      <form onSubmit={hPwd(onSavePwd)}>
        <Card className="p-5 sm:p-6">
          <SectionTitle>Superadmin Panel Login (Email & Password)</SectionTitle>
          <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
            Current password is required to update email or password. If you enter an incorrect current password, the update will be rejected.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={<>Current Password <span className="text-red-500">*</span></>}
              type="password" placeholder="Enter current password"
              error={pwdErr.currentPassword?.message}
              classNames={{ root: "sm:col-span-2" }}
              {...regPwd("currentPassword", { required: "Current password is required" })}
            />
            <Input label="New Login Email (optional)" type="email"
              prefix={<EnvelopeIcon className="size-4" />}
              placeholder="New email address" error={pwdErr.newEmail?.message}
              {...regPwd("newEmail")} />
            <Input label="New Password (optional)" type="password"
              placeholder="Min 8 characters" error={pwdErr.newPassword?.message}
              {...regPwd("newPassword", { minLength: { value: 8, message: "Min 8 characters" } })} />
            <Input label="Confirm New Password" type="password"
              placeholder="Repeat new password" error={pwdErr.confirmPassword?.message}
              {...regPwd("confirmPassword")} />
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" color="primary" className="gap-2 min-w-[12rem]" disabled={savingPwd}>
              {savingPwd && <GhostSpinner variant="soft" className="size-4 border-2" />}
              Update Superadmin Login
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
