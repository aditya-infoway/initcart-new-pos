import { NavigationTree } from "@/@types/navigation";

export const posB2BInventory: NavigationTree = {
  id: "posB2BInventory",
  type: "collapse",
  path: "/b2b-inventory",
  title: "B2B Inventory",
  icon: "posB2BInventory",
  branchOnly: true,
  childs: [
    { id: "posB2BInventory.stockReturn", type: "item", path: "/b2b-inventory/stock-return", title: "Stock Return", icon: "posB2BInventory.stockReturn" },
    { 
      id: "posB2BInventory.stockTransfer", 
      type: "collapse", 
      path: "/b2b-inventory/stock-transfer", 
      title: "Stock Transfer", 
      icon: "posB2BInventory.stockTransfer",
      childs: [
        { id: "posB2BInventory.stockTransfer.sendOrder", type: "item", path: "/b2b-inventory/stock-transfer/send-order", title: "Send Order", icon: "posB2BInventory.stockTransfer.sendOrder" },
        { id: "posB2BInventory.stockTransfer.receivedOrders", type: "item", path: "/b2b-inventory/stock-transfer/received-orders", title: "Received Orders", icon: "posB2BInventory.stockTransfer.receivedOrders" },
      ]
    },
  ],
};
