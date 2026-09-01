import { NavigationTree } from "@/@types/navigation";

export const posMasterMenu: NavigationTree = {
  id: "posMasterMenu",
  type: "collapse",
  path: "/accounts",
  title: "Master",
  icon: "posMasterMenu",
  childs: [
    { id: "posMasterMenu.accountCreation",  type: "item", path: "/accounts",          title: "Account Creation",  icon: "posMasterMenu.accountCreation" },
    { id: "posMasterMenu.branchMaster",     type: "item", path: "/branchMaster",      title: "Branch Master",     icon: "posMasterMenu.branchMaster", superAdminOnly: true },
    { id: "posMasterMenu.addItems",         type: "item", path: "/items",             title: "Add Items",         icon: "posMasterMenu.addItems" },
    { id: "posMasterMenu.websiteItems",     type: "item", path: "/WebItems",          title: "Website Items",     icon: "posMasterMenu.websiteItems" },
    { id: "posMasterMenu.itemBarcodes",     type: "item", path: "/barcodes",          title: "Item Barcodes",     icon: "posMasterMenu.itemBarcodes" },
    { id: "posMasterMenu.orders",           type: "item", path: "/Orders",            title: "Orders",            icon: "posMasterMenu.orders" },
    { id: "posMasterMenu.group",            type: "item", path: "/createGroup",       title: "Group",             icon: "posMasterMenu.group" },
    { id: "posMasterMenu.itemImport",       type: "item", path: "/ExcelImportExport", title: "Item Import",       icon: "posMasterMenu.itemImport" },
  ],
};
