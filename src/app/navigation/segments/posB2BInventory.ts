import { NavigationTree } from "@/@types/navigation";

export const posB2BInventory: NavigationTree = {
  id: "posB2BInventory",
  type: "collapse",
  path: "/b2bstockReturn",
  title: "B2B Inventory",
  icon: "posB2BInventory",
  branchOnly: true,
  childs: [
    { id: "posB2BInventory.stockReturn", type: "item", path: "/b2bstockReturn", title: "Stock Return", icon: "posB2BInventory.stockReturn" },
    {
      id: "posB2BInventory.stockTransfer",
      type: "collapse",
      path: "/B2BStockTransfer",
      title: "Stock Transfer",
      icon: "posB2BInventory.stockTransfer",
      childs: [
        { id: "posB2BInventory.stockTransfer.sendOrder",      type: "item", path: "/B2BStockTransfer",   title: "Send Order",      icon: "posB2BInventory.stockTransfer.sendOrder",      branchOnly: true },
        { id: "posB2BInventory.stockTransfer.receivedOrders", type: "item", path: "/B2BOrderRequest",    title: "Received Orders", icon: "posB2BInventory.stockTransfer.receivedOrders", branchOnly: true },
      ],
    },
  ],
};
