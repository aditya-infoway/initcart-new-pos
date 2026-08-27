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

const isSuperAdmin = () => localStorage.getItem("role") === "superadmin";


function filterNavigationByRole(items: NavigationTree[]): NavigationTree[] {
  const superAdmin = isSuperAdmin();
  return items
    .filter((item) => {
      if (item.superAdminOnly && !superAdmin) return false;
      if (item.branchOnly && superAdmin) return false;
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
]; export const getNavigation = (): NavigationTree[] => filterNavigationByRole(rawNavigation);
export const navigation = getNavigation();