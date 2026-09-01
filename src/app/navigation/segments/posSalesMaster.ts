import { NavigationTree } from "@/@types/navigation";

export const posSalesMaster: NavigationTree = {
  id: "posSalesMaster",
  type: "collapse",
  path: "/sales",
  title: "Sales Master",
  icon: "posSalesMaster",
  childs: [
    { id: "posSalesMaster.salesEntryReport",  type: "item", path: "/sales",          title: "Sales Entry & Report",  icon: "posSalesMaster.salesEntryReport" },
    { id: "posSalesMaster.salesEntry2",       type: "item", path: "/salesentry2",    title: "Sales Entry 2",         icon: "posSalesMaster.salesEntry2" },
    { id: "posSalesMaster.salesReturnReport", type: "item", path: "/sales-return",   title: "Sales Return & Report", icon: "posSalesMaster.salesReturnReport" },
    { id: "posSalesMaster.b2bSales",          type: "item", path: "/b2bsales",       title: "B2B Sales",             icon: "posSalesMaster.b2bSales", superAdminOnly: true },
  ],
};
