import { NavigationTree } from "@/@types/navigation";

export const posAccounting: NavigationTree = {
  id: "posAccounting",
  type: "collapse",
  path: "/Bank-payment",
  title: "Accounting",
  icon: "posAccounting",
  childs: [
    { id: "posAccounting.bankPayment",    type: "item", path: "/Bank-payment",       title: "Bank Payment",        icon: "posAccounting.bankPayment" },
    { id: "posAccounting.bankReceipt",    type: "item", path: "/Bank-receipt",       title: "Bank Receipt",        icon: "posAccounting.bankReceipt" },
    { id: "posAccounting.cashPayment",    type: "item", path: "/Cash-Payment",       title: "Cash Payment",        icon: "posAccounting.cashPayment" },
    { id: "posAccounting.cashReceipt",    type: "item", path: "/Cash-receipt",       title: "Cash Receipt",        icon: "posAccounting.cashReceipt" },
    { id: "posAccounting.contra",         type: "item", path: "/Contra",             title: "Contra",              icon: "posAccounting.contra" },
    { id: "posAccounting.journalEntries", type: "item", path: "/JournalEntries",     title: "Journal Entries",     icon: "posAccounting.journalEntries" },
    { id: "posAccounting.salesProfit",    type: "item", path: "/salesProfitReport",  title: "Sales Profit Report", icon: "posAccounting.salesProfit" },
  ],
};
