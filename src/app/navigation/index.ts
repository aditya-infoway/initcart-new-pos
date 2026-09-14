import { NavigationTree } from "@/@types/navigation";
import { posDashboard } from "./segments/posDashboard";
import { posMasterMenu } from "./segments/posMasterMenu";
import { posOrderManagement } from "./segments/posOrderManagement";
import { posPurchaseMaster } from "./segments/posPurchaseMaster";
import { posSalesMaster } from "./segments/posSalesMaster";
import { posStockMaster } from "./segments/posStockMaster";
import { posB2BInventory } from "./segments/posB2BInventory";
import { posTransactionMaster } from "./segments/posTransactionMaster";
import { posReporting } from "./segments/posReporting";
import { posAccounting } from "./segments/posAccounting";
import { posEmployeeManagement } from "./segments/posEmployeeManagement";
import { posLogout } from "./segments/posLogout";
import { posMyBranches } from "./segments/posMybranchMaster";

const isSuperAdmin = () => localStorage.getItem("role") === "superadmin";
const isEmployee = () => localStorage.getItem("role") === "employee";

// ✅ Sirf ownership_type "franchise" wale users ko franchise maano
const isFranchise = () => {
  try {
    const branchData = localStorage.getItem("branch");
    if (branchData) {
      const branch = JSON.parse(branchData);
      if (branch?.ownership_type === "franchise") return true;
    }
  } catch (error) {
    console.error("Error parsing branch data:", error);
  }
  return false;
};

interface Permission {
  page_key: string;
  can_view: boolean;
}

const getAllowedKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem("permissions");
    const perms: Permission[] = raw ? JSON.parse(raw) : [];
    return new Set(perms.filter((p) => p.can_view).map((p) => p.page_key));
  } catch {
    return new Set();
  }
};

/**
 * ✅ CORE FIX: "superAdminLike" = superadmin KHUD ho, YA employee ho
 * (kyunki employee superadmin ke hi branch ke andar kaam karta hai,
 * alag branch nahi hota). Dono ke liye structural flags (branchOnly,
 * superAdminOnly, franchiseOnly) SAME tarike se apply hone chahiye.
 * Employee ke liye sirf ek extra filter lagta hai: uske paas us page
 * ka can_view permission hona chahiye.
 */
function filterStructural(
  items: NavigationTree[],
  opts: { superAdminLike: boolean; franchise: boolean }
): NavigationTree[] {
  const { superAdminLike, franchise } = opts;

  return items
    .filter((item) => {
      if (item.franchiseOnly) return franchise && !superAdminLike;
      if (item.superAdminOnly) return superAdminLike;
      if (item.branchOnly) return !superAdminLike;
      return true;
    })
    .map((item) =>
      item.childs
        ? { ...item, childs: filterStructural(item.childs, opts) }
        : item
    )
    .filter((item) => !item.childs || item.childs.length > 0);
}

function applyEmployeePermissionFilter(items: NavigationTree[]): NavigationTree[] {
  const allowedKeys = getAllowedKeys();

  return items
    .filter((item) => {
      if (item.alwaysVisible) return true; // Dashboard, Logout
      if (!item.childs) {
        return item.path ? allowedKeys.has(item.path) : false;
      }
      return true; // parent — child filter ke baad neeche khali ho to hat jaayega
    })
    .map((item) =>
      item.childs
        ? { ...item, childs: applyEmployeePermissionFilter(item.childs) }
        : item
    )
    .filter((item) => !item.childs || item.childs.length > 0);
}

const rawNavigation = [
  posDashboard,
  posMyBranches,
  posMasterMenu,
  posEmployeeManagement,
  posOrderManagement,
  posPurchaseMaster,
  posSalesMaster,
  posStockMaster,
  posB2BInventory,
  posAccounting,
  posTransactionMaster,
  posReporting,
  posLogout,
];

// ── Sidebar ke liye (role ke hisaab se actual final menu) ──────────────────
export const getNavigation = (): NavigationTree[] => {
  const superAdmin = isSuperAdmin();
  const employee = isEmployee();
  const franchise = isFranchise();

  // Employee ho ya superadmin — dono "superAdminLike" hain structural flags ke liye
  const superAdminLike = superAdmin || employee;

  let menu = filterStructural(rawNavigation, { superAdminLike, franchise });

  // Employee ke liye ek extra pass: sirf jinpe can_view permission hai
  if (employee) {
    menu = applyEmployeePermissionFilter(menu);
  }

  return menu;
};

export const navigation = getNavigation();

// ── Employee-permissions "Set Access" page ke liye ──────────────────────────
// Ye EXACTLY wahi list hai jo superadmin khud dekh sakta hai (Employee
// Management ko chhod ke) — taaki jo assign kiya ja sake wahi employee
// ko dikhे, aur nav config badalne par dono jagah apne aap sync rahein.
export interface FlatNavPage {
  page_key: string;
  page_label: string;
  group: string;
}

export const getAssignablePages = (): FlatNavPage[] => {
  const superAdminView = filterStructural(rawNavigation, {
    superAdminLike: true,
    franchise: false,
  });

  const flat: FlatNavPage[] = [];

  const walk = (items: NavigationTree[], groupTitle?: string) => {
    items.forEach((item) => {
      if (item.id === "posEmployeeManagement") return; // employee ko khud employee manage karne ki permission kabhi nahi
      if (item.id === "posDashboard" || item.id === "posLogout") return; // ye hamesha visible hain, assign karne ki zaroorat nahi
      if (item.childs && item.childs.length > 0) {
        walk(item.childs, item.title ?? "");
      } else if (item.path && item.path !== "#") {
        flat.push({
          page_key: item.path,
          page_label: item.title ?? item.path,
          group: groupTitle || item.title || "Other",
        });
      }
    });
  };

  walk(superAdminView);
  return flat;
}; 

                                                                                                                                                                                                                                                                                                                  