// navigation.ts
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

// ✅ Sirf ownership_type "franchise" wale users ko franchise maano
const isFranchise = () => {
  try {
    const branchData = localStorage.getItem("branch");
    if (branchData) {
      const branch = JSON.parse(branchData);
      console.log("🔍 Branch data:", branch);
      
      // ✅ ONLY check ownership_type === "franchise"
      if (branch?.ownership_type === "franchise") {
        console.log("✅ Branch is franchise (ownership_type: franchise)");
        return true;
      } else {
        console.log(`❌ Branch is NOT franchise (ownership_type: ${branch?.ownership_type})`);
      }
    }
  } catch (error) {
    console.error("Error parsing branch data:", error);
  }
  
  return false;
};

function filterNavigationByRole(items: NavigationTree[]): NavigationTree[] {
  const superAdmin = isSuperAdmin();
  const franchise = isFranchise();

  console.log("=== Navigation Filter ===");
  console.log("SuperAdmin:", superAdmin);
  console.log("Franchise:", franchise);
  console.log("=========================");

  return items
    .filter((item) => {
      // ✅ Franchise only items: Sirf franchise users ko dikhao
      if (item.franchiseOnly) {
        const show = franchise && !superAdmin;
        console.log(`📌 ${item.title}: franchiseOnly = ${show}`);
        return show;
      }
      
      // SuperAdmin only items
      if (item.superAdminOnly) {
        return superAdmin;
      }
      
      // Branch only items (hide from superadmin)
      if (item.branchOnly) {
        return !superAdmin;
      }

      return true;
    })
    .map((item) =>
      item.childs
        ? { ...item, childs: filterNavigationByRole(item.childs) }
        : item
    );
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

export const getNavigation = (): NavigationTree[] => filterNavigationByRole(rawNavigation);
export const navigation = getNavigation();