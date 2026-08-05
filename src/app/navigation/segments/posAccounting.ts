import { NavigationTree } from "@/@types/navigation";

export const posAccounting: NavigationTree = {
  id: "posAccounting",
  type: "collapse",
  path: "/pos/accounting",
  title: "Accounting",
  icon: "posAccounting",
  childs: [
    { id: "posAccounting.bankPayment",    type: "item", path: "/pos/accounting/bank-payment",    title: "Bank Payment",    icon: "posAccounting.bankPayment" },
    { id: "posAccounting.bankReceipt",    type: "item", path: "/pos/accounting/bank-receipt",    title: "Bank Receipt",    icon: "posAccounting.bankReceipt" },
    { id: "posAccounting.cashPayment",    type: "item", path: "/pos/accounting/cash-payment",    title: "Cash Payment",    icon: "posAccounting.cashPayment" },
    { id: "posAccounting.cashReceipt",    type: "item", path: "/pos/accounting/cash-receipt",    title: "Cash Receipt",    icon: "posAccounting.cashReceipt" },
    { id: "posAccounting.contra",         type: "item", path: "/pos/accounting/contra",          title: "Contra",          icon: "posAccounting.contra" },
    { id: "posAccounting.journalEntries", type: "item", path: "/pos/accounting/journal-entries", title: "Journal Entries", icon: "posAccounting.journalEntries" },
    { id: "posAccounting.salesProfit",    type: "item", path: "/pos/accounting/sales-profit-report", title: "Sales Profit Report", icon: "posAccounting.salesProfit" },
  ],
};
