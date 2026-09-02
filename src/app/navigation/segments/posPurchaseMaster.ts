import { NavigationTree } from "@/@types/navigation";

export const posPurchaseMaster: NavigationTree = {
  id: "posPurchaseMaster",
  type: "collapse",
  path: "/purchases",
  title: "Purchase Master",
  icon: "posPurchaseMaster",
  childs: [
    { id: "posPurchaseMaster.purchaseEntry",              type: "item", path: "/Addpurchaseitem",    title: "Purchase Entry",           icon: "posPurchaseMaster.purchaseEntry" },
    { id: "posPurchaseMaster.purchaseExcelImportExport",  type: "item", path: "/purchaseimport",     title: "Purchase Excel Import",    icon: "posPurchaseMaster.purchaseExcelImportExport" },
    { id: "posPurchaseMaster.purchaseReturn",             type: "item", path: "/purchaseReturnList", title: "Purchase Return",          icon: "posPurchaseMaster.purchaseReturn" },
    { id: "posPurchaseMaster.createOrder",                type: "item", path: "/Addpurchaseitem",    title: "Create Order",             icon: "posPurchaseMaster.createOrder" },
    { id: "posPurchaseMaster.purchaseOrderVerify",        type: "item", path: "/purchaseorder",      title: "Purchase Order Verify",    icon: "posPurchaseMaster.purchaseOrderVerify" },
    { id: "posPurchaseMaster.b2bPurchaseVerification",    type: "item", path: "/b2bpurchaseverify",  title: "B2B Purchase Verification",icon: "posPurchaseMaster.b2bPurchaseVerification", branchOnly: true },
  ],
};
