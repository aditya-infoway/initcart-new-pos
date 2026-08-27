import { NavigationTree } from "@/@types/navigation";

export const posSalesMaster: NavigationTree = {
  id: "posSalesMaster",
  type: "collapse",
  path: "/sales",
  title: "Sales Master",
  icon: "posSalesMaster",
  childs: [
    { id: "posSalesMaster.salesEntryReport",  type: "item", path: "/sales/sales-entry-report",  title: "Sales Entry & Report",  icon: "posSalesMaster.salesEntryReport" },
    { id: "posSalesMaster.salesEntry2",       type: "item", path: "/sales/sales-entry2",         title: "Sales Entry2",          icon: "posSalesMaster.salesEntry2" },
    { id: "posSalesMaster.salesReturnReport", type: "item", path: "/sales/sales-return-report",  title: "Sales Return & Report", icon: "posSalesMaster.salesReturnReport" },
    { id: "posSalesMaster.b2bSales",          type: "item", path: "/sales/b2b-sales",               title: "B2B Sales",               icon: "posSalesMaster.b2bSales", superAdminOnly: true },
  ],
};
