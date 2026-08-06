import { NavigationTree } from "@/@types/navigation";

export const posPurchaseMaster: NavigationTree = {
  id: "posPurchaseMaster",
  type: "collapse",
  path: "/purchase",
  title: "Purchase Master",
  icon: "posPurchaseMaster",
  childs: [
    { id: "posPurchaseMaster.purchaseEntry",       type: "item", path: "/purchase/purchase-entry",        title: "Purchase Entry",        icon: "posPurchaseMaster.purchaseEntry" },
    { id: "posPurchaseMaster.purchaseReturn",      type: "item", path: "/purchase/purchase-return",       title: "Purchase Return",       icon: "posPurchaseMaster.purchaseReturn" },
    { id: "posPurchaseMaster.createOrder",         type: "item", path: "/purchase/create-order",          title: "Create Order",          icon: "posPurchaseMaster.createOrder" },
    { id: "posPurchaseMaster.purchaseOrderVerify", type: "item", path: "/purchase/purchase-order-verify", title: "Purchase Order Verify", icon: "posPurchaseMaster.purchaseOrderVerify" },
  ],
};
