import { NavigationTree } from "@/@types/navigation";

export const posMasterMenu: NavigationTree = {
  id: "posMasterMenu",
  type: "collapse",
  path: "/pos/master-menu",
  title: "Master",
  icon: "posMasterMenu",
  childs: [
    { id: "posMasterMenu.accountCreation",  type: "item", path: "/pos/master-menu/account-creation",  title: "Account Creation",  icon: "posMasterMenu.accountCreation" },
    { id: "posMasterMenu.addItems",         type: "item", path: "/pos/master-menu/add-items",          title: "Add Items",          icon: "posMasterMenu.addItems" },
    { id: "posMasterMenu.websiteItems",     type: "item", path: "/pos/master-menu/website-items",      title: "Website Items",      icon: "posMasterMenu.websiteItems" },
    { id: "posMasterMenu.itemBarcodes",     type: "item", path: "/pos/master-menu/item-barcodes",      title: "Item Barcodes",      icon: "posMasterMenu.itemBarcodes" },
    { id: "posMasterMenu.orders",           type: "item", path: "/pos/master-menu/orders",             title: "Orders",             icon: "posMasterMenu.orders" },
    { id: "posMasterMenu.group",            type: "item", path: "/pos/master-menu/group",              title: "Group",              icon: "posMasterMenu.group" },
    { id: "posMasterMenu.itemImport",       type: "item", path: "/pos/master-menu/item-import",        title: "Item Import",        icon: "posMasterMenu.itemImport" },
  ],
};
