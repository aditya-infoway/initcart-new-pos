import { NavigationTree } from "@/@types/navigation";

export const posMasterMenu: NavigationTree = {
  id: "posMasterMenu",
  type: "collapse",
  path: "/master-menu",
  title: "Master",
  icon: "posMasterMenu",
  childs: [
    { id: "posMasterMenu.accountCreation",  type: "item", path: "/master-menu/account-creation",  title: "Account Creation",  icon: "posMasterMenu.accountCreation" },
    { id: "posMasterMenu.addItems",         type: "item", path: "/master-menu/add-items",          title: "Add Items",          icon: "posMasterMenu.addItems" },
    { id: "posMasterMenu.websiteItems",     type: "item", path: "/master-menu/website-items",      title: "Website Items",      icon: "posMasterMenu.websiteItems" },
    { id: "posMasterMenu.itemBarcodes",     type: "item", path: "/master-menu/item-barcodes",      title: "Item Barcodes",      icon: "posMasterMenu.itemBarcodes" },
    { id: "posMasterMenu.orders",           type: "item", path: "/master-menu/orders",             title: "Orders",             icon: "posMasterMenu.orders" },
    { id: "posMasterMenu.group",            type: "item", path: "/master-menu/group",              title: "Group",              icon: "posMasterMenu.group" },
    { id: "posMasterMenu.itemImport",       type: "item", path: "/master-menu/item-import",        title: "Item Import",        icon: "posMasterMenu.itemImport" },
    { id: "posMasterMenu.branchMaster",     type: "item", path: "/master-menu/branch-master",      title: "Branch Master",      icon: "posMasterMenu.branchMaster" },
  ],
};
