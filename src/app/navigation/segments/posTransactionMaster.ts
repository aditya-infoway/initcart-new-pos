import { NavigationTree } from "@/@types/navigation";

export const posTransactionMaster: NavigationTree = {
  id: "posTransactionMaster",
  type: "collapse",
  path: "/pos/transaction",
  title: "Transaction Master",
  icon: "posTransactionMaster",
  childs: [
    { id: "posTransactionMaster.debitNote",    type: "item", path: "/pos/transaction/debit-note",    title: "Debit Note",    icon: "posTransactionMaster.debitNote" },
    { id: "posTransactionMaster.creditNote",   type: "item", path: "/pos/transaction/credit-note",   title: "Credit Note",   icon: "posTransactionMaster.creditNote" },
    { id: "posTransactionMaster.quickReceipt", type: "item", path: "/pos/transaction/quick-receipt", title: "Quick Receipt", icon: "posTransactionMaster.quickReceipt" },
    { id: "posTransactionMaster.quickPayment", type: "item", path: "/pos/transaction/quick-payment", title: "Quick Payment", icon: "posTransactionMaster.quickPayment" },
    { id: "posTransactionMaster.ledgerReport", type: "item", path: "/pos/transaction/ledger-report", title: "Ledger Report", icon: "posTransactionMaster.ledgerReport" },
    { id: "posTransactionMaster.dayBook",      type: "item", path: "/pos/transaction/day-book",      title: "Day Book",      icon: "posTransactionMaster.dayBook" },
    { id: "posTransactionMaster.cashBook",     type: "item", path: "/pos/transaction/cash-book",     title: "Cash Book",     icon: "posTransactionMaster.cashBook" },
    { id: "posTransactionMaster.bankBook",     type: "item", path: "/pos/transaction/bank-book",     title: "Bank Book",     icon: "posTransactionMaster.bankBook" },
  ],
};
