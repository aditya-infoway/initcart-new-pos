import { NavigationTree } from "@/@types/navigation";

export const posStockMaster: NavigationTree = {
  id: "posStockMaster",
  type: "collapse",
  path: "/stock",
  title: "Stock Master",
  icon: "posStockMaster",
  childs: [
    { id: "posStockMaster.stockReport", type: "item", path: "/stock/stock-report", title: "Stock Report", icon: "posStockMaster.stockReport" },
    { id: "posStockMaster.stockReturnManagement", type: "item", path: "/b2b-inventory/stock-return-management", title: "Stock Return Management", icon: "posB2BInventory.stockReturnManagement", superAdminOnly:true },
    { id: "posStockMaster.b2bStockReturnManagement", type: "item", path: "/b2b-inventory/b2b-stock-return-management", title: "B2B Stock Return Management", icon: "posB2BInventory.b2bStockReturnManagement", superAdminOnly:true },
    { id: "posStockMaster.schemeOffer", type: "item", path: "/b2b-inventory/scheme-offer", title: "Scheme Offer", icon: "posB2BInventory.schemeOffer", superAdminOnly: true},
    { id: "posStockMaster.stockTransfer", type: "item", path: "/stock/stock-transfer", title: "Stock Transfer", icon: "posB2BInventory.stockTransfer", superAdminOnly: true},
        // ✅ Scheme Offer - Branch view (for employees/branch users)
    { 
      id: "posStockMaster.mySchemeOffers", 
      type: "item", 
      path: "/b2b-inventory/scheme-offer/my-offers", 
      title: "My Scheme Offers", 
      icon: "posB2BInventory.schemeOffer", 
      branchOnly: true // ← Branch users can see this
    },
  ],
};
