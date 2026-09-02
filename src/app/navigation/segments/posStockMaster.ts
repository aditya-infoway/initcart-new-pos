import { NavigationTree } from "@/@types/navigation";

export const posStockMaster: NavigationTree = {
  id: "posStockMaster",
  type: "collapse",
  path: "/stock-report",
  title: "Stock Master",
  icon: "posStockMaster",
  childs: [
    { id: "posStockMaster.stockReport",              type: "item", path: "/stock-report",               title: "Stock Report",                icon: "posStockMaster.stockReport" },
    { id: "posStockMaster.stockReturnManagement",    type: "item", path: "/stockReturnverification",    title: "Stock Return Management",     icon: "posB2BInventory.stockReturnManagement",    superAdminOnly: true },
    { id: "posStockMaster.b2bStockReturnManagement", type: "item", path: "/b2bstockReturnverification", title: "B2B Stock Return Management", icon: "posB2BInventory.b2bStockReturnManagement", superAdminOnly: true },
    { id: "posStockMaster.schemeOffer",              type: "item", path: "/SchemeOffer",                title: "Scheme Offer",                icon: "posB2BInventory.schemeOffer",              superAdminOnly: true },
    { id: "posStockMaster.stockTransfer",            type: "item", path: "/stockTransfer",              title: "Stock Transfer",              icon: "posB2BInventory.stockTransfer",            superAdminOnly: true },
    { id: "posStockMaster.mySchemeOffers",           type: "item", path: "/SchemeOfferRegister",        title: "My Scheme Offers",            icon: "posB2BInventory.schemeOffer",              branchOnly: true },
  ],
};
