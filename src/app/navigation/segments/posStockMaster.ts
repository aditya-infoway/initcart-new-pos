import { NavigationTree } from "@/@types/navigation";

export const posStockMaster: NavigationTree = {
  id: "posStockMaster",
  type: "collapse",
  path: "/pos/stock",
  title: "Stock Master",
  icon: "posStockMaster",
  childs: [
    { id: "posStockMaster.stockReport", type: "item", path: "/pos/stock/stock-report", title: "Stock Report", icon: "posStockMaster.stockReport" },
  ],
};
