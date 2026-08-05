import { NavigationTree } from "@/@types/navigation";

export const posOrderManagement: NavigationTree = {
  id: "posOrderManagement",
  type: "collapse",
  path: "/pos/order-management",
  title: "Order Management",
  icon: "posOrderManagement",
  childs: [
    { id: "posOrderManagement.orderItems",        type: "item", path: "/pos/order-management/order-items",        title: "Order Items",        icon: "posOrderManagement.orderItems" },
    { id: "posOrderManagement.stockVerification",  type: "item", path: "/pos/order-management/stock-verification", title: "Stock Verification", icon: "posOrderManagement.stockVerification" },
    { id: "posOrderManagement.stockReturn",        type: "item", path: "/pos/order-management/stock-return",       title: "Stock Return",       icon: "posOrderManagement.stockReturn" },
  ],
};
