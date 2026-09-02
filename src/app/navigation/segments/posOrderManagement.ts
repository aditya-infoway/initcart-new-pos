import { NavigationTree } from "@/@types/navigation";

export const posOrderManagement: NavigationTree = {
  id: "posOrderManagement",
  type: "collapse",
  path: "/order-items",
  title: "Order Management",
  icon: "posOrderManagement",
  branchOnly: true,
  childs: [
    { id: "posOrderManagement.orderItems",       type: "item", path: "/order-items",          title: "Order Items",        icon: "posOrderManagement.orderItems" },
    { id: "posOrderManagement.stockVerification", type: "item", path: "/stock-verification",   title: "Stock Verification", icon: "posOrderManagement.stockVerification" },
    { id: "posOrderManagement.stockReturn",       type: "item", path: "/stockReturn",          title: "Stock Return",       icon: "posOrderManagement.stockReturn" },
    { id: "posOrderManagement.stockTransfer",     type: "item", path: "/stockTransfer",        title: "Stock Transfer",     icon: "posOrderManagement.stockTransfer", superAdminOnly: true },
  ],
};
