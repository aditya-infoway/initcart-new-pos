import { NavigationTree } from "@/@types/navigation";

export const posTransactionMaster: NavigationTree = {
  id: "posTransactionMaster",
  type: "collapse",
  path: "/ledger-report",
  title: "Transaction Master",
  icon: "posTransactionMaster",
  childs: [
    { id: "posTransactionMaster.ledgerReport", type: "item", path: "/ledger-report", title: "Ledger Report", icon: "posTransactionMaster.ledgerReport" },
    { id: "posTransactionMaster.dayBook",      type: "item", path: "/dayBook",       title: "Day Book",      icon: "posTransactionMaster.dayBook" },
    { id: "posTransactionMaster.cashBook",     type: "item", path: "/cashBook",      title: "Cash Book",     icon: "posTransactionMaster.cashBook" },
    { id: "posTransactionMaster.bankBook",     type: "item", path: "/bankBook",      title: "Bank Book",     icon: "posTransactionMaster.bankBook" },
  ],
};
