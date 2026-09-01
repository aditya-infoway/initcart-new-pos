// pages/my-branches/data.ts
export type BranchStatus = "active" | "inactive";
export type BranchRole = "branch" | "branch_customer" | "branch_agent" | "branch_both" | "vendor";

export interface MyBranch {
  id: number;
  branch_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  gst_number?: string;
  pan_number?: string;
  status: BranchStatus;
  linked_account_name?: string | null;
  created_at?: string;
  sundry_debitor_account?: number | string;
  sundry_creditor_account?: number | string;
  role?: BranchRole;
}

export interface ApiMyBranch {
  id: number;
  branch_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  gst_number?: string;
  pan_number?: string;
  status: BranchStatus;
  linked_account_name?: string | null;
  created_at?: string;
  sundry_debitor_account?: number | string;
  sundry_creditor_account?: number | string;
  role?: BranchRole;
}

export interface MyTaxDetails {
  gst_number: string;
  pan_number: string;
}

export interface LinkableAccount {
  id: number;
  account_name: string;
}

export interface LinkableAccountsResponse {
  debitor_accounts: LinkableAccount[];
  creditor_accounts: LinkableAccount[];
}

export const STATUS_OPTIONS = [
  { id: "all", label: "All Status" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

export const BRANCH_STATUS_OPTIONS = [
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

export const ROLE_OPTIONS = [
  { id: "branch", label: "Branch" },
  { id: "branch_customer", label: "Branch Customer" },
  { id: "branch_agent", label: "Branch Agent" },
  { id: "branch_both", label: "Branch Both" },
  { id: "vendor", label: "Vendor" },
];

export const mapApiMyBranch = (raw: Record<string, any>): MyBranch => ({
  id: Number(raw.id ?? 0),
  branch_name: String(raw.branch_name ?? raw.name ?? ""),
  owner_name: String(raw.owner_name ?? raw.ownerName ?? ""),
  phone: String(raw.phone ?? raw.phone_number ?? raw.contact ?? ""),
  email: String(raw.email ?? ""),
  address: String(raw.address ?? ""),
  country: String(raw.country ?? ""),
  state: String(raw.state ?? ""),
  city: String(raw.city ?? ""),
  gst_number: String(raw.gst_number ?? raw.gstNumber ?? ""),
  pan_number: String(raw.pan_number ?? raw.panNumber ?? ""),
  status: (raw.status ?? "active") as BranchStatus,
  linked_account_name: raw.linked_account_name ?? raw.linkedAccountName ?? null,
  created_at: String(raw.created_at ?? raw.createdAt ?? ""),
  sundry_debitor_account: raw.sundry_debitor_account ?? raw.sundryDebitorAccount ?? "",
  sundry_creditor_account: raw.sundry_creditor_account ?? raw.sundryCreditorAccount ?? "",
  role: (raw.role ?? "branch") as BranchRole,
});

export const mapApiTaxDetails = (raw: Record<string, any>): MyTaxDetails => ({
  gst_number: String(raw.gst_number ?? raw.gstNumber ?? ""),
  pan_number: String(raw.pan_number ?? raw.panNumber ?? ""),
});

export interface MyBranchFormValues {
  branch_name: string;
  owner_name: string;
  phone: string;
  email: string;
  password: string;
  confirm_password: string;
  address: string;
  country: string;
  state: string;
  city: string;
  sundry_debitor_account: number | string;
  sundry_creditor_account: number | string;
  status: BranchStatus;
  role: BranchRole;
}

export const emptyMyBranchForm = (): MyBranchFormValues => ({
  branch_name: "",
  owner_name: "",
  phone: "",
  email: "",
  password: "",
  confirm_password: "",
  address: "",
  country: "",
  state: "",
  city: "",
  sundry_debitor_account: "",
  sundry_creditor_account: "",
  status: "active",
  role: "branch",
});

export const buildMyBranchFormValues = (branch: MyBranch | null): MyBranchFormValues => ({
  branch_name: branch?.branch_name ?? "",
  owner_name: branch?.owner_name ?? "",
  phone: branch?.phone ?? "",
  email: branch?.email ?? "",
  password: "",
  confirm_password: "",
  address: branch?.address ?? "",
  country: branch?.country ?? "",
  state: branch?.state ?? "",
  city: branch?.city ?? "",
  sundry_debitor_account: branch?.sundry_debitor_account ?? "",
  sundry_creditor_account: branch?.sundry_creditor_account ?? "",
  status: branch?.status ?? "active",
  role: branch?.role ?? "branch",
});