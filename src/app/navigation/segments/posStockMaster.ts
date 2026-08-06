import { NavigationTree } from "@/@types/navigation";

export const posStockMaster: NavigationTree = {
  id: "posStockMaster",
  type: "collapse",
  path: "/stock",
  title: "Stock Master",
  icon: "posStockMaster",
  childs: [
    { id: "posStockMaster.stockReport", type: "item", path: "/stock/stock-report", title: "Stock Report", icon: "posStockMaster.stockReport" },
  ],
};
