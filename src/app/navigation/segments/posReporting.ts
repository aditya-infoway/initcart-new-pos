import { NavigationTree } from "@/@types/navigation";

export const posReporting: NavigationTree = {
  id: "posReporting",
  type: "collapse",
  path: "/outStandingReport",
  title: "Reporting",
  icon: "posReporting",
  childs: [
    { id: "posReporting.outstanding",            type: "item", path: "/outStandingReport",         title: "Outstanding",              icon: "posReporting.outstanding" },
    { id: "posReporting.salesEntryReport",       type: "item", path: "/salesEntryRegister",        title: "Sales Entry Report",       icon: "posReporting.salesEntryReport" },
    { id: "posReporting.salesRegister",          type: "item", path: "/salesReturnList",           title: "Sales Register",           icon: "posReporting.salesRegister" },
    { id: "posReporting.purchaseRegister",       type: "item", path: "/purchaseRegister",          title: "Purchase Register",        icon: "posReporting.purchaseRegister" },
    { id: "posReporting.salesReturnRegister",    type: "item", path: "/salesReturnRegister",       title: "Sales Return Register",    icon: "posReporting.salesReturnRegister" },
    { id: "posReporting.purchaseReturnRegister", type: "item", path: "/purchaseReturnRegister",    title: "Purchase Return Register", icon: "posReporting.purchaseReturnRegister" },
    { id: "posReporting.duePayment",             type: "item", path: "/duePaymentReport",          title: "Due Payment",              icon: "posReporting.duePayment" },
    { id: "posReporting.debitNoteRegister",      type: "item", path: "/debit-note",               title: "Debit Note Register",      icon: "posReporting.debitNoteRegister" },
    { id: "posReporting.creditNoteRegister",     type: "item", path: "/credit-note",              title: "Credit Note Register",     icon: "posReporting.creditNoteRegister" },
    { id: "posReporting.quickReceiptRegister",   type: "item", path: "/Cash-receipt",             title: "Quick Receipt Register",   icon: "posReporting.quickReceiptRegister" },
    { id: "posReporting.quickPaymentRegister",   type: "item", path: "/Cash-Payment",             title: "Quick Payment Register",   icon: "posReporting.quickPaymentRegister" },
  ],
};
