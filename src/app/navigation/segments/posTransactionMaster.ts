import { NavigationTree } from "@/@types/navigation";

export const posTransactionMaster: NavigationTree = {
  id: "posTransactionMaster",
  type: "collapse",
  path: "/transaction",
  title: "Transaction Master",
  icon: "posTransactionMaster",
  childs: [

    { id: "posTransactionMaster.ledgerReport", type: "item", path: "/transaction/ledger-report", title: "Ledger Report", icon: "posTransactionMaster.ledgerReport" },
    { id: "posTransactionMaster.dayBook", type: "item", path: "/transaction/day-book", title: "Day Book", icon: "posTransactionMaster.dayBook" },
    { id: "posTransactionMaster.cashBook", type: "item", path: "/transaction/cash-book", title: "Cash Book", icon: "posTransactionMaster.cashBook" },
    { id: "posTransactionMaster.bankBook", type: "item", path: "/transaction/bank-book", title: "Bank Book", icon: "posTransactionMaster.bankBook" },
  ],
};
